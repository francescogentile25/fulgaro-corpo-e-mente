import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { DatePipe } from '@angular/common';
import { ExerciseStore } from '../store/exercise.store';
import { ExerciseModel, TipoEsercizio, ModalitaEsercizio } from '../models/exercise.model';
import { ExerciseCreateRequest } from '../models/requests/exercise-request.model';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-exercise-list',
  imports: [
    ReactiveFormsModule, FormsModule,
    TableModule, ButtonModule, DialogModule,
    InputTextModule, TextareaModule,
    SelectModule, TagModule, TooltipModule, MessageModule,
    DatePipe,
  ],
  templateUrl: './exercise-list.html',
})
export class ExerciseList implements OnInit {

  store = inject(ExerciseStore);
  private fb = inject(FormBuilder);

  // ── Stato dialogs ────────────────────────────────────────

  dialogVisible  = false;
  deleteVisible  = false;
  editingExercise: ExerciseModel | null = null;
  exerciseToDelete: ExerciseModel | null = null;

  // ── Filtri ───────────────────────────────────────────────

  searchText    = '';
  filterTipo: string | null = null;

  // ── Opzioni select ───────────────────────────────────────

  readonly tipoOptions = [
    { label: 'Intervallato',  value: 'intervallato' },
    { label: 'Corsa continua', value: 'continua' },
    { label: 'Potenziamento', value: 'potenziamento' },
    { label: 'Riposo',        value: 'riposo' },
    { label: 'Gara',          value: 'gara' },
  ];

  readonly tipoFilterOptions = [
    { label: 'Tutti i tipi', value: null },
    ...this.tipoOptions,
  ];

  readonly subtipoContinuaOptions = [
    { label: 'Easy / Recupero', value: 'easy' },
    { label: 'Lungo',            value: 'lungo' },
    { label: 'Progressione',     value: 'progressione' },
    { label: 'Tempo / Ritmo',    value: 'tempo' },
  ];

  readonly tipoRecuperoOptions = [
    { label: 'Passivo', value: 'passivo' },
    { label: 'Attivo',  value: 'attivo' },
  ];

  // ── Form ─────────────────────────────────────────────────

  form = this.fb.group({
    nome:              [''],
    tipo:              ['intervallato' as TipoEsercizio, Validators.required],
    modalita:          ['strutturato' as ModalitaEsercizio, Validators.required],
    testo_libero:      [''],
    subtipo_continua:  [null as string | null],
    durata_min:        [null as number | null],
    distanza_km:       [null as number | null],
    ritmo_obiettivo:   [''],
    distanza_gara_km:  [null as number | null],
    note:              [''],
    blocks: this.fb.array([]),
  });

  get blocks(): FormArray { return this.form.get('blocks') as FormArray; }
  get tipoValue(): TipoEsercizio { return this.form.get('tipo')?.value as TipoEsercizio; }
  get modalitaValue(): ModalitaEsercizio { return this.form.get('modalita')?.value as ModalitaEsercizio; }

  // ── Init ─────────────────────────────────────────────────

  ngOnInit(): void {
    this.store.getAll$();
  }

  // ── Filtro lista ─────────────────────────────────────────

  get filteredExercises(): ExerciseModel[] {
    let list = this.store.entities();
    if (this.filterTipo) list = list.filter(e => e.tipo === this.filterTipo);
    if (this.searchText.trim()) {
      const q = this.searchText.toLowerCase();
      list = list.filter(e =>
        (e.nome ?? '').toLowerCase().includes(q) ||
        e.tipo.toLowerCase().includes(q)
      );
    }
    return list;
  }

  // ── Tabs modalità ────────────────────────────────────────

  setModalita(m: ModalitaEsercizio): void {
    this.form.patchValue({ modalita: m });
    // Reset blocchi se si passa a testo libero
    if (m === 'testo_libero') {
      this.blocks.clear();
    }
  }

  // ── Gestione blocchi ─────────────────────────────────────

  createBlockGroup(): FormGroup {
    return this.fb.group({
      ripetizioni:     [1,          [Validators.required, Validators.min(1)]],
      distanza_m:      [null,       [Validators.required, Validators.min(1)]],
      ritmo_obiettivo: [''],
      recupero_min:    [null],
      tipo_recupero:   ['passivo'],
    });
  }

  addBlock(): void {
    this.blocks.push(this.createBlockGroup());
  }

  removeBlock(i: number): void {
    this.blocks.removeAt(i);
  }

  // ── Apri / Chiudi dialog ─────────────────────────────────

  openCreate(): void {
    this.editingExercise = null;
    this.form.reset({ tipo: 'intervallato', modalita: 'strutturato' });
    this.blocks.clear();
    this.addBlock(); // primo blocco di default
    this.dialogVisible = true;
  }

  openEdit(exercise: ExerciseModel): void {
    this.editingExercise = exercise;
    this.blocks.clear();

    this.form.patchValue({
      nome:             exercise.nome ?? '',
      tipo:             exercise.tipo,
      modalita:         exercise.modalita,
      testo_libero:     exercise.testo_libero ?? '',
      subtipo_continua: exercise.subtipo_continua,
      durata_min:       exercise.durata_min,
      distanza_km:      exercise.distanza_km,
      ritmo_obiettivo:  exercise.ritmo_obiettivo ?? '',
      distanza_gara_km: exercise.distanza_gara_km,
      note:             exercise.note ?? '',
    });

    // Ripristina blocchi
    (exercise.exercise_blocks ?? []).forEach(b => {
      const group = this.createBlockGroup();
      group.patchValue(b);
      this.blocks.push(group);
    });

    this.dialogVisible = true;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const request: ExerciseCreateRequest = {
      nome:             v.nome || null,
      tipo:             v.tipo!,
      modalita:         v.modalita!,
      testo_libero:     v.modalita === 'testo_libero' ? (v.testo_libero || null) : null,
      subtipo_continua: v.subtipo_continua as any ?? null,
      durata_min:       v.durata_min ? Number(v.durata_min) : null,
      distanza_km:      v.distanza_km ? Number(v.distanza_km) : null,
      ritmo_obiettivo:  v.ritmo_obiettivo || null,
      distanza_gara_km: v.distanza_gara_km ? Number(v.distanza_gara_km) : null,
      note:             v.note || null,
      blocks:           v.modalita === 'strutturato'
        ? (v.blocks as any[]).map(b => ({
            ripetizioni:     Number(b.ripetizioni) || 1,
            distanza_m:      Number(b.distanza_m) || 0,
            ritmo_obiettivo: b.ritmo_obiettivo || null,
            recupero_min:    b.recupero_min ? Number(b.recupero_min) : null,
            tipo_recupero:   b.tipo_recupero,
          }))
        : [],
    };

    if (this.editingExercise) {
      this.store.edit$({ ...request, id: this.editingExercise.id });
    } else {
      this.store.add$(request);
    }
    this.dialogVisible = false;
  }

  // ── Elimina ───────────────────────────────────────────────

  confirmDelete(exercise: ExerciseModel): void {
    this.exerciseToDelete = exercise;
    this.deleteVisible    = true;
  }

  doDelete(): void {
    if (this.exerciseToDelete) this.store.delete$(this.exerciseToDelete.id);
    this.deleteVisible    = false;
    this.exerciseToDelete = null;
  }

  // ── Helpers view ────────────────────────────────────────

  tipoLabel(tipo: TipoEsercizio): string {
    return this.tipoOptions.find(o => o.value === tipo)?.label ?? tipo;
  }

  tipoSeverity(tipo: TipoEsercizio): TagSeverity {
    const map: Record<TipoEsercizio, TagSeverity> = {
      intervallato: 'info',
      continua:     'success',
      potenziamento:'warn',
      riposo:       'secondary',
      gara:         'danger',
    };
    return map[tipo] ?? 'secondary';
  }

  exerciseSummary(e: ExerciseModel): string {
    if (e.modalita === 'testo_libero') {
      const txt = e.testo_libero ?? '';
      return txt.length > 70 ? txt.substring(0, 70) + '…' : (txt || '—');
    }
    switch (e.tipo) {
      case 'intervallato': {
        const n = e.exercise_blocks?.length ?? 0;
        if (n === 0) return 'Nessun blocco';
        const preview = e.exercise_blocks.slice(0, 2)
          .map(b => `${b.ripetizioni}×${b.distanza_m}m`)
          .join(' + ');
        return n > 2 ? preview + ` + …` : preview;
      }
      case 'continua':
        return [e.distanza_km ? `${e.distanza_km}km` : null, e.ritmo_obiettivo ? `@ ${e.ritmo_obiettivo}` : null]
          .filter(Boolean).join(' ') || '—';
      case 'gara':
        return e.distanza_gara_km ? `${e.distanza_gara_km}km` : '—';
      default:
        return e.note ?? '—';
    }
  }
}
