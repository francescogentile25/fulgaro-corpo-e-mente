import {
  Component, EventEmitter, inject, Input,
  OnChanges, Output, SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { TextareaModule } from 'primeng/textarea';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';

import { WorkoutAssignmentModel } from '../models/workout-assignment.model';
import { ExerciseBlockModel } from '../../exercises/models/exercise-block.model';
import { TipoEsercizio } from '../../exercises/models/exercise.model';
import { AuthStore } from '../../auth/store/auth.store';
import { PerformanceLogService, parseTime, formatTime, expectedSeconds } from '../services/performance-log.service';
import { PerformanceLogInsert } from '../models/performance-log.model';
import { ScheduleService } from '../services/schedule.service';

@Component({
  selector: 'app-workout-detail-panel',
  imports: [
    FormsModule,
    ButtonModule, DrawerModule, TextareaModule, SkeletonModule, TooltipModule,
  ],
  templateUrl: './workout-detail-panel.html',
  styleUrl:    './workout-detail-panel.scss',
})
export class WorkoutDetailPanel implements OnChanges {

  @Input() visible   = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() assignment: WorkoutAssignmentModel | null = null;
  @Input() isAdmin = false;

  @Output() editRequested      = new EventEmitter<WorkoutAssignmentModel>();
  @Output() assignmentUpdated  = new EventEmitter<WorkoutAssignmentModel>();

  private perfService     = inject(PerformanceLogService);
  private scheduleService = inject(ScheduleService);
  private messageService  = inject(MessageService);
  readonly authStore      = inject(AuthStore);

  // ── Stato interno ──────────────────────────────────────────────
  loading   = false;
  saving    = false;
  completato  = false;
  noteAtleta  = '';

  /** timeInputs[blockIndex][repIndex] = stringa "mm:ss" */
  timeInputs: string[][] = [];

  // ── Lifecycle ─────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    const openedNow = changes['visible']?.currentValue === true
      && changes['visible']?.previousValue !== true;

    if (openedNow && this.assignment) {
      this.initPanel();
    }
    if (changes['visible']?.currentValue === false) {
      this.resetState();
    }
    // se cambia l'assignment mentre è aperto
    if (changes['assignment'] && this.visible && this.assignment) {
      this.initPanel();
    }
  }

  private initPanel(): void {
    const a = this.assignment!;
    this.completato  = a.completato;
    this.noteAtleta  = a.note_atleta ?? '';

    const blocks = a.exercise?.exercise_blocks ?? [];
    this.timeInputs = blocks.map(b => Array(b.ripetizioni).fill(''));

    if (blocks.length === 0) return;

    this.loading = true;
    this.perfService.getLogsForAssignment(a.id).subscribe({
      next: logs => {
        logs.forEach(log => {
          if (!log.block_id) return;
          const bi = blocks.findIndex(b => b.id === log.block_id);
          const ri = log.ripetizione_n - 1;
          if (bi >= 0 && ri >= 0 && ri < blocks[bi].ripetizioni) {
            this.timeInputs[bi][ri] = log.tempo_display;
          }
        });
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  private resetState(): void {
    this.timeInputs = [];
    this.completato  = false;
    this.noteAtleta  = '';
    this.loading     = false;
    this.saving      = false;
  }

  // ── Azioni ────────────────────────────────────────────────────

  close(): void { this.visibleChange.emit(false); }

  requestEdit(): void {
    if (this.assignment) this.editRequested.emit(this.assignment);
  }

  save(): void {
    if (this.saving || !this.assignment) return;
    this.saving = true;

    const a      = this.assignment;
    const blocks = a.exercise?.exercise_blocks ?? [];
    const userId = this.authStore.user()!.id;

    const logs: PerformanceLogInsert[] = [];
    for (let bi = 0; bi < blocks.length; bi++) {
      for (let ri = 0; ri < blocks[bi].ripetizioni; ri++) {
        const raw = this.timeInputs[bi]?.[ri] ?? '';
        const sec = parseTime(raw);
        if (sec !== null) {
          logs.push({
            assignment_id: a.id,
            block_id:      blocks[bi].id,
            ripetizione_n: ri + 1,
            tempo_sec:     sec,
            tempo_display: formatTime(sec),
            inserito_da:   userId,
          });
        }
      }
    }

    this.perfService.saveLogsForAssignment(a.id, logs).pipe(
      switchMap(() => this.scheduleService.updateAssignment(a.id, {
        completato:  this.completato,
        note_atleta: this.noteAtleta.trim() || null,
      }))
    ).subscribe({
      next: updated => {
        this.saving = false;
        this.assignmentUpdated.emit(updated);
        this.messageService.add({ severity: 'success', summary: 'Salvato', detail: 'Tempi e stato aggiornati' });
        this.visibleChange.emit(false);
      },
      error: () => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Errore', detail: 'Impossibile salvare' });
      },
    });
  }

  // ── Helpers tempo ─────────────────────────────────────────────

  /** Formatta l'input al blur (es. "130" → "2:10") */
  formatTimeInput(bi: number, ri: number): void {
    const raw = this.timeInputs[bi]?.[ri] ?? '';
    const sec = parseTime(raw);
    this.timeInputs[bi][ri] = sec !== null ? formatTime(sec) : '';
  }

  expectedDisplay(block: ExerciseBlockModel): string {
    if (!block.ritmo_obiettivo || !block.distanza_m) return '';
    const sec = expectedSeconds(block.ritmo_obiettivo, block.distanza_m);
    return sec !== null ? formatTime(sec) : '';
  }

  getDelta(bi: number, ri: number, block: ExerciseBlockModel): { sec: number; faster: boolean } | null {
    if (!block.ritmo_obiettivo || !block.distanza_m) return null;
    const target = expectedSeconds(block.ritmo_obiettivo, block.distanza_m);
    if (target === null) return null;
    const actual = parseTime(this.timeInputs[bi]?.[ri] ?? '');
    if (actual === null) return null;
    const diff = actual - target;
    return { sec: Math.abs(Math.round(diff * 10) / 10), faster: diff < 0 };
  }

  repetitions(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  // ── Helpers view ──────────────────────────────────────────────

  get showTimeGrid(): boolean {
    const ex = this.assignment?.exercise;
    if (!ex) return false;
    return ex.modalita === 'strutturato'
      && (ex.tipo === 'intervallato' || ex.tipo === 'potenziamento')
      && (ex.exercise_blocks?.length ?? 0) > 0;
  }

  get drawerHeader(): string {
    if (!this.assignment) return '';
    const d = new Date(this.assignment.data_workout + 'T00:00:00');
    return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  readonly tipoOptions = [
    { label: 'Intervallato',   value: 'intervallato' },
    { label: 'Corsa continua', value: 'continua' },
    { label: 'Potenziamento',  value: 'potenziamento' },
    { label: 'Riposo',         value: 'riposo' },
    { label: 'Gara',           value: 'gara' },
  ];

  tipoLabel(tipo: TipoEsercizio | undefined): string {
    if (!tipo) return '—';
    return this.tipoOptions.find(o => o.value === tipo)?.label ?? tipo;
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
}
