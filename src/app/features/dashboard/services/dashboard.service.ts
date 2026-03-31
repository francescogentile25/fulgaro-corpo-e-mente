import { inject, Injectable } from '@angular/core';
import { forkJoin, from, map, Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';

// ─── TIPI ────────────────────────────────────────────────────────────────────

export interface NextWorkout {
  id: string;
  data_workout: string;
  completato: boolean;
  exercise: {
    tipo: string;
    nome: string | null;
    distanza_km: number | null;
    distanza_gara_km: number | null;
  } | null;
}

export interface AtletaStats {
  kmSettimana: number;
  kmMese: number;
  allenamentiSettimana: number;
  completatiSettimana: number;
  percCompletamentoSettimana: number;
  nextWorkouts: NextWorkout[];
}

export interface AdminStats {
  atletiAttivi: number;
  allenamentiSettimana: number;
  completatiSettimana: number;
  percCompletamentoSettimana: number;
}

export interface AdminWeeklyStats {
  labels: string[];
  assigned: number[];
  completed: number[];
}

export interface AtletaWeeklyKm {
  labels: string[];
  km: number[];
  tipoLabels: string[];
  tipoData: number[];
}

// ─── HELPERS PRIVATI ─────────────────────────────────────────────────────────

function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // lunedì
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split('T')[0],
    end:   sunday.toISOString().split('T')[0],
  };
}

function getMonthRange(date: Date): { start: string; end: string } {
  const y = date.getFullYear();
  const m = date.getMonth();
  const start = new Date(y, m, 1);
  const end   = new Date(y, m + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end:   end.toISOString().split('T')[0],
  };
}

function calcKmFromExercise(exercise: any): number {
  if (!exercise) return 0;
  const tipo = exercise.tipo as string;
  if (tipo === 'riposo') return 0;
  if (tipo === 'gara') return exercise.distanza_gara_km ?? 0;
  if (tipo === 'intervallato') {
    return ((exercise.exercise_blocks ?? []) as any[]).reduce(
      (sum: number, b: any) => sum + (b.distanza_m * b.ripetizioni) / 1000,
      0
    );
  }
  return exercise.distanza_km ?? 0;
}

// ─── SERVICE ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private supabase = inject(SupabaseService);

  /** Statistiche per l'atleta: km settimana/mese, % completamento, prossimi allenamenti */
  getAtletaStats(atletaId: string): Observable<AtletaStats> {
    const today     = new Date();
    const todayStr  = today.toISOString().split('T')[0];
    const week      = getWeekRange(today);
    const month     = getMonthRange(today);

    const exerciseSelect = 'tipo, distanza_km, distanza_gara_km, exercise_blocks(distanza_m, ripetizioni)';

    return forkJoin({
      weekData: from(
        this.supabase.client
          .from('workout_assignments')
          .select(`id, completato, exercise:exercises(${exerciseSelect})`)
          .eq('atleta_id', atletaId)
          .gte('data_workout', week.start)
          .lte('data_workout', week.end)
      ),
      monthData: from(
        this.supabase.client
          .from('workout_assignments')
          .select(`id, completato, exercise:exercises(${exerciseSelect})`)
          .eq('atleta_id', atletaId)
          .gte('data_workout', month.start)
          .lte('data_workout', month.end)
      ),
      nextWorkouts: from(
        this.supabase.client
          .from('workout_assignments')
          .select('id, data_workout, completato, exercise:exercises(tipo, nome, distanza_km, distanza_gara_km)')
          .eq('atleta_id', atletaId)
          .eq('completato', false)
          .gte('data_workout', todayStr)
          .order('data_workout', { ascending: true })
          .limit(3)
      ),
    }).pipe(
      map(({ weekData, monthData, nextWorkouts }) => {
        if (weekData.error)  throw weekData.error;
        if (monthData.error) throw monthData.error;

        const week  = (weekData.data  ?? []) as any[];
        const month = (monthData.data ?? []) as any[];

        const kmSettimana = week.reduce((s, a) => s + calcKmFromExercise(a.exercise), 0);
        const kmMese      = month.reduce((s, a) => s + calcKmFromExercise(a.exercise), 0);

        const totaleSettimana    = week.length;
        const completatiSettimana = week.filter(a => a.completato).length;
        const percCompl = totaleSettimana > 0
          ? Math.round((completatiSettimana / totaleSettimana) * 100)
          : 0;

        return {
          kmSettimana:               Math.round(kmSettimana * 10) / 10,
          kmMese:                    Math.round(kmMese * 10) / 10,
          allenamentiSettimana:      totaleSettimana,
          completatiSettimana,
          percCompletamentoSettimana: percCompl,
          nextWorkouts:              (nextWorkouts.data ?? []) as unknown as NextWorkout[],
        };
      })
    );
  }

  /** Admin: ultime 4 settimane — allenamenti assegnati vs completati */
  getAdminWeeklyStats(): Observable<AdminWeeklyStats> {
    const weeks = Array.from({ length: 4 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      return getWeekRange(d);
    });

    return forkJoin(
      weeks.map(range =>
        from(
          this.supabase.client
            .from('workout_assignments')
            .select('id, completato')
            .gte('data_workout', range.start)
            .lte('data_workout', range.end)
        ).pipe(map(({ data }) => ({ range, data: (data ?? []) as { completato: boolean }[] })))
      )
    ).pipe(
      map(results => {
        const reversed = [...results].reverse();
        return {
          labels:    reversed.map(r => {
            const d = new Date(r.range.start);
            return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
          }),
          assigned:  reversed.map(r => r.data.length),
          completed: reversed.map(r => r.data.filter(a => a.completato).length),
        };
      })
    );
  }

  /** Atleta: ultime 6 settimane — km per settimana + distribuzione tipi */
  getAtletaWeeklyKm(atletaId: string): Observable<AtletaWeeklyKm> {
    const exerciseSel = 'tipo, distanza_km, distanza_gara_km, exercise_blocks(distanza_m, ripetizioni)';
    const weeks = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      return getWeekRange(d);
    });

    return forkJoin(
      weeks.map(range =>
        from(
          this.supabase.client
            .from('workout_assignments')
            .select(`exercise:exercises(${exerciseSel})`)
            .eq('atleta_id', atletaId)
            .gte('data_workout', range.start)
            .lte('data_workout', range.end)
        ).pipe(map(({ data }) => ({ range, data: (data ?? []) as any[] })))
      )
    ).pipe(
      map(results => {
        const reversed = [...results].reverse();
        const labels = reversed.map(r => {
          const d = new Date(r.range.start);
          return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
        });
        const km = reversed.map(r =>
          Math.round(r.data.reduce((s: number, a: any) => s + calcKmFromExercise(a.exercise), 0) * 10) / 10
        );

        // Distribuzione tipi su tutte le settimane
        const tipoMap: Record<string, string> = {
          continua: 'Corsa continua', intervallato: 'Intervalli',
          potenziamento: 'Potenziamento', riposo: 'Riposo', gara: 'Gara',
        };
        const tipoCounts: Record<string, number> = {};
        results.flatMap(r => r.data).forEach((a: any) => {
          const t = a.exercise?.tipo ?? 'altro';
          tipoCounts[t] = (tipoCounts[t] ?? 0) + 1;
        });
        const tipoLabels = Object.keys(tipoCounts).map(k => tipoMap[k] ?? k);
        const tipoData   = Object.values(tipoCounts);

        return { labels, km, tipoLabels, tipoData };
      })
    );
  }

  /** Statistiche per l'admin: atleti attivi, allenamenti settimana, % completamento */
  getAdminStats(): Observable<AdminStats> {
    const week = getWeekRange(new Date());

    return forkJoin({
      athleteCount: from(
        this.supabase.client
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('ruolo', 'atleta')
          .eq('attivo', true)
      ),
      weekData: from(
        this.supabase.client
          .from('workout_assignments')
          .select('id, completato')
          .gte('data_workout', week.start)
          .lte('data_workout', week.end)
      ),
    }).pipe(
      map(({ athleteCount, weekData }) => {
        const atletiAttivi   = athleteCount.count ?? 0;
        const assignments    = (weekData.data ?? []) as any[];
        const totale         = assignments.length;
        const completati     = assignments.filter(a => a.completato).length;
        const percCompl      = totale > 0 ? Math.round((completati / totale) * 100) : 0;

        return {
          atletiAttivi,
          allenamentiSettimana:       totale,
          completatiSettimana:        completati,
          percCompletamentoSettimana: percCompl,
        };
      })
    );
  }
}
