import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';

import { ScheduleService } from '../services/schedule.service';
import { WorkoutAssignmentModel } from '../models/workout-assignment.model';
import { ExerciseCreateRequest } from '../../exercises/models/requests/exercise-request.model';
import { TipoEsercizio, ModalitaEsercizio } from '../../exercises/models/exercise.model';
import { ProfileModel } from '../../auth/models/responses/profile.model';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthStore } from '../../auth/store/auth.store';
import { globalPaths } from '../../_config/global-paths.config';
import { WorkoutDetailPanel } from '../workout-detail-panel/workout-detail-panel';

// ── Helpers date ─────────────────────────────────────────────

function getWeekStart(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(d.getDate() + n);
  return result;
}

@Component({
  selector: 'app-athlete-schedule',
  imports: [
    ReactiveFormsModule, FormsModule, RouterLink, DatePipe,
    ButtonModule, DrawerModule, InputTextModule, TextareaModule,
    SelectModule, SelectButtonModule, InputNumberModule,
    TagModule, TooltipModule, DialogModule,
    SkeletonModule, DividerModule, WorkoutDetailPanel,
  ],
  templateUrl: './athlete-schedule.html',
})
export class AthleteSchedule implements OnInit {

  private route           = inject(ActivatedRoute);
  private scheduleService = inject(ScheduleService);
  private supabase        = inject(SupabaseService);
  private fb              = inject(FormBuilder);
  private messageService  = inject(MessageService);
  private destroyRef      = inject(DestroyRef);
  readonly authStore      = inject(AuthStore);

  readonly schedeUrl = globalPaths.schedeUrl;

  // ── Detail panel (inserimento tempi) ─────────────────────
  detailVisible    = false;
  detailAssignment = signal<WorkoutAssignmentModel | null>(null);

  // ── Atleta ────────────────────────────────────────────────
  atleta    = signal<ProfileModel | null>(null);
  atletaId  = signal('');

  // ── Settimana ─────────────────────────────────────────────
  weekStart   = signal(getWeekStart(new Date()));
  loading     = signal(false);
  assignments = signal<WorkoutAssignmentModel[]>([]);

  readonly DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  weekDays = computed(() =>
    Array.from({ length: 7 }, (_, i) => addDays(this.weekStart(), i))
  );

  weekLabel = computed(() => {
    const start = this.weekStart();
    const end   = addDays(start, 6);
    const fmt   = (d: Date) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    return `${fmt(start)} – ${fmt(end)} ${end.getFullYear()}`;
  });

  isCurrentWeek = computed(() =>
    toISODate(this.weekStart()) === toISODate(getWeekStart(new Date()))
  );

  // ── Drawer ────────────────────────────────────────────────
  drawerVisible      = false;
  selectedDate       = signal('');
  editingAssignment  = signal<WorkoutAssignmentModel | null>(null);
  savingWorkout      = false;

  // ── Dialog eliminazione ───────────────────────────────────
  deleteVisible        = false;
  assignmentToDelete: WorkoutAssignmentModel | null = null;

  // ── Opzioni form ──────────────────────────────────────────
  readonly tipoOptions = [
    { label: 'Intervallato',   value: 'intervallato' },
    { label: 'Corsa continua', value: 'continua' },
    { label: 'Potenziamento',  value: 'potenziamento' },
    { label: 'Riposo',         value: 'riposo' },
    { label: 'Gara',           value: 'gara' },
  ];

  readonly subtipoContinuaOptions = [
    { label: 'Easy / Recupero', value: 'easy' },
    { label: 'Lungo',           value: 'lungo' },
    { label: 'Progressione',    value: 'progressione' },
    { label: 'Tempo / Ritmo',   value: 'tempo' },
  ];

  readonly tipoRecuperoOptions = [
    { label: 'Passivo', value: 'passivo' },
    { label: 'Attivo',  value: 'attivo' },
  ];

  readonly modalitaOptions = [
    { label: 'Strutturato', value: 'strutturato', icon: 'pi pi-list' },
    { label: 'Testo libero', value: 'testo_libero', icon: 'pi pi-align-left' },
  ];

  // ── Form ──────────────────────────────────────────────────
  form = this.fb.group({
    nome:             [''],
    tipo:             ['intervallato' as TipoEsercizio, Validators.required],
    modalita:         ['strutturato' as ModalitaEsercizio, Validators.required],
    testo_libero:     [''],
    subtipo_continua: [null as string | null],
    durata_min:       [null as number | null],
    distanza_km:      [null as number | null],
    ritmo_obiettivo:  [''],
    distanza_gara_km: [null as number | null],
    note:             [''],
    blocks:           this.fb.array([]),
  });

  get blocks(): FormArray      { return this.form.get('blocks') as FormArray; }
  get tipoValue(): TipoEsercizio      { return this.form.get('tipo')?.value as TipoEsercizio; }
  get modalitaValue(): ModalitaEsercizio { return this.form.get('modalita')?.value as ModalitaEsercizio; }

  // ── Init ──────────────────────────────────────────────────

  ngOnInit(): void {
    // Quando l'utente passa a testo_libero, svuota i blocchi
    this.form.get('modalita')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(m => { if (m === 'testo_libero') this.blocks.clear(); });

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        // Se non c'è parametro (rotta /la-mia-scheda), usa l'ID dell'utente corrente
        const id = params.get('atletaId') ?? this.authStore.user()?.id ?? '';
        this.atletaId.set(id);
        this.loadAtleta(id);
        this.loadWeek();
      });
  }

  private loadAtleta(id: string): void {
    this.supabase.client.from('profiles').select('*').eq('id', id).single()
      .then(({ data }) => this.atleta.set(data as ProfileModel));
  }

  loadWeek(): void {
    const from = toISODate(this.weekStart());
    const to   = toISODate(addDays(this.weekStart(), 6));
    this.loading.set(true);
    this.scheduleService
      .getAthleteWeek(this.atletaId(), from, to)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  data  => { this.assignments.set(data); this.loading.set(false); },
        error: ()    => this.loading.set(false),
      });
  }

  prevWeek(): void { this.weekStart.set(addDays(this.weekStart(), -7)); this.loadWeek(); }
  nextWeek(): void { this.weekStart.set(addDays(this.weekStart(), 7));  this.loadWeek(); }
  goToday():  void { this.weekStart.set(getWeekStart(new Date()));       this.loadWeek(); }

  // ── Helpers calendario ────────────────────────────────────

  getAssignmentForDay(date: Date): WorkoutAssignmentModel | undefined {
    return this.assignments().find(a => a.data_workout === toISODate(date));
  }

  isToday(date: Date): boolean {
    return toISODate(date) === toISODate(new Date());
  }

  formatDayHeader(date: Date): string {
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  }

  // ── Detail panel (tempi + completato) ────────────────────

  openDetail(assignment: WorkoutAssignmentModel): void {
    this.detailAssignment.set(assignment);
    this.detailVisible = true;
  }

  onAssignmentUpdated(updated: WorkoutAssignmentModel): void {
    this.assignments.update(list =>
      list.map(a => a.id === updated.id ? updated : a)
    );
    this.detailVisible = false;
  }

  // ── Drawer: apri per creare ───────────────────────────────

  openCreate(date: Date): void {
    this.editingAssignment.set(null);
    this.selectedDate.set(toISODate(date));
    this.form.reset({ tipo: 'intervallato', modalita: 'strutturato' });
    this.blocks.clear();
    this.addBlock();
    this.drawerVisible = true;
  }

  // ── Drawer: apri per modificare ───────────────────────────

  openEdit(assignment: WorkoutAssignmentModel): void {
    this.editingAssignment.set(assignment);
    this.selectedDate.set(assignment.data_workout);
    const ex = assignment.exercise;
    this.blocks.clear();

    this.form.patchValue({
      nome:             ex.nome ?? '',
      tipo:             ex.tipo,
      modalita:         ex.modalita,
      testo_libero:     ex.testo_libero ?? '',
      subtipo_continua: ex.subtipo_continua,
      durata_min:       ex.durata_min,
      distanza_km:      ex.distanza_km,
      ritmo_obiettivo:  ex.ritmo_obiettivo ?? '',
      distanza_gara_km: ex.distanza_gara_km,
      note:             ex.note ?? '',
    });

    (ex.exercise_blocks ?? []).forEach(b => {
      const g = this.createBlockGroup();
      g.patchValue(b);
      this.blocks.push(g);
    });

    this.drawerVisible = true;
  }

  // ── Gestione blocchi ──────────────────────────────────────

  createBlockGroup() {
    return this.fb.group({
      ripetizioni:     [1,    [Validators.required, Validators.min(1)]],
      distanza_m:      [null as number | null, [Validators.required, Validators.min(1)]],
      ritmo_obiettivo: [''],
      recupero_min:    [null as number | null],
      tipo_recupero:   ['passivo'],
    });
  }

  addBlock():             void { this.blocks.push(this.createBlockGroup()); }
  removeBlock(i: number): void { this.blocks.removeAt(i); }

  setModalita(m: ModalitaEsercizio): void {
    this.form.patchValue({ modalita: m });
    if (m === 'testo_libero') this.blocks.clear();
  }

  // ── Salva ─────────────────────────────────────────────────

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;
    const request: ExerciseCreateRequest = {
      nome:             v.nome || null,
      tipo:             v.tipo!,
      modalita:         v.modalita!,
      testo_libero:     v.modalita === 'testo_libero' ? (v.testo_libero || null) : null,
      subtipo_continua: v.subtipo_continua as any ?? null,
      durata_min:       v.durata_min       ? Number(v.durata_min)       : null,
      distanza_km:      v.distanza_km      ? Number(v.distanza_km)      : null,
      ritmo_obiettivo:  v.ritmo_obiettivo  || null,
      distanza_gara_km: v.distanza_gara_km ? Number(v.distanza_gara_km) : null,
      note:             v.note || null,
      blocks: v.modalita === 'strutturato'
        ? (v.blocks as any[]).map(b => ({
            ripetizioni:     Number(b.ripetizioni) || 1,
            distanza_m:      Number(b.distanza_m)  || 0,
            ritmo_obiettivo: b.ritmo_obiettivo || null,
            recupero_min:    b.recupero_min ? Number(b.recupero_min) : null,
            tipo_recupero:   b.tipo_recupero,
          }))
        : [],
    };

    this.savingWorkout = true;
    const editing = this.editingAssignment();

    if (editing) {
      this.scheduleService
        .updateWorkout(editing.id, editing.exercise_id, request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: updated => {
            this.assignments.update(list => list.map(a => a.id === updated.id ? updated : a));
            this.drawerVisible = false;
            this.savingWorkout = false;
            this.messageService.add({ severity: 'success', summary: 'Salvato', detail: 'Allenamento aggiornato' });
          },
          error: () => { this.savingWorkout = false; },
        });
    } else {
      this.scheduleService
        .createWorkout(this.atletaId(), this.selectedDate(), request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: created => {
            this.assignments.update(list => [...list, created].sort((a, b) =>
              a.data_workout.localeCompare(b.data_workout)
            ));
            this.drawerVisible = false;
            this.savingWorkout = false;
            this.messageService.add({ severity: 'success', summary: 'Aggiunto', detail: 'Allenamento assegnato' });
          },
          error: () => { this.savingWorkout = false; },
        });
    }
  }

  // ── Elimina ───────────────────────────────────────────────

  confirmDelete(assignment: WorkoutAssignmentModel, event: Event): void {
    event.stopPropagation();
    this.assignmentToDelete = assignment;
    this.deleteVisible      = true;
  }

  doDelete(): void {
    if (!this.assignmentToDelete) return;
    const { id, exercise_id } = this.assignmentToDelete;
    this.scheduleService.deleteWorkout(id, exercise_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.assignments.update(list => list.filter(a => a.id !== id));
          this.messageService.add({ severity: 'info', summary: 'Eliminato', detail: 'Allenamento rimosso' });
          this.deleteVisible      = false;
          this.assignmentToDelete = null;
        },
      });
  }

  // ── Helpers view ──────────────────────────────────────────

  exerciseSummary(assignment: WorkoutAssignmentModel): string {
    const ex = assignment?.exercise;
    if (!ex) return '—';
    if (ex.modalita === 'testo_libero') {
      const txt = ex.testo_libero ?? '';
      return txt.length > 80 ? txt.substring(0, 80) + '…' : (txt || '—');
    }
    switch (ex.tipo) {
      case 'intervallato': {
        const blocks = ex.exercise_blocks ?? [];
        if (!blocks.length) return 'Nessun blocco';
        const preview = blocks.slice(0, 2).map(b => `${b.ripetizioni}×${b.distanza_m}m`).join(' + ');
        return blocks.length > 2 ? preview + ' +…' : preview;
      }
      case 'continua':
        return [ex.distanza_km ? `${ex.distanza_km} km` : null, ex.ritmo_obiettivo ? `@ ${ex.ritmo_obiettivo}` : null]
          .filter(Boolean).join(' ') || '—';
      case 'gara':
        return ex.distanza_gara_km ? `Gara ${ex.distanza_gara_km} km` : 'Gara';
      case 'riposo':
        return 'Riposo';
      default:
        return ex.note ?? ex.tipo;
    }
  }

  tipoColorClass(tipo: TipoEsercizio | undefined): string {
    if (!tipo) return 'bg-slate-100 text-slate-500 border-slate-200';
    const map: Record<TipoEsercizio, string> = {
      intervallato:  'bg-blue-100 text-blue-700 border-blue-200',
      continua:      'bg-emerald-100 text-emerald-700 border-emerald-200',
      potenziamento: 'bg-amber-100 text-amber-700 border-amber-200',
      riposo:        'bg-slate-100 text-slate-500 border-slate-200',
      gara:          'bg-red-100 text-red-700 border-red-200',
    };
    return map[tipo] ?? 'bg-slate-100 text-slate-500 border-slate-200';
  }

  tipoLabel(tipo: TipoEsercizio | undefined): string {
    if (!tipo) return '—';
    return this.tipoOptions.find(o => o.value === tipo)?.label ?? tipo;
  }

  drawerHeader = computed(() => {
    const date = this.selectedDate();
    if (!date) return '';
    const d = new Date(date + 'T00:00:00');
    const label = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    return this.editingAssignment() ? `Modifica — ${label}` : `Nuovo allenamento — ${label}`;
  });
}
