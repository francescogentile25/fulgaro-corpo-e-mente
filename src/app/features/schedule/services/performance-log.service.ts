import { inject, Injectable } from '@angular/core';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { PerformanceLogInsert, PerformanceLogModel } from '../models/performance-log.model';

// ── Helpers tempo (min:sec) ──────────────────────────────────────────────────

/**
 * Converte stringa "mm:ss" o secondi puri in numero di secondi.
 * "1:30" → 90 | "90" → 90 | "1:30.5" → 90.5
 */
export function parseTime(input: string): number | null {
  const s = input.trim();
  if (!s) return null;
  const colonMatch = s.match(/^(\d+):(\d{1,2})(?:[.,](\d+))?$/);
  if (colonMatch) {
    const min = parseInt(colonMatch[1], 10);
    const sec = parseInt(colonMatch[2], 10);
    const dec = colonMatch[3] ? parseFloat(`0.${colonMatch[3]}`) : 0;
    const total = min * 60 + sec + dec;
    return total > 0 ? total : null;
  }
  const num = parseFloat(s);
  return !isNaN(num) && num > 0 ? num : null;
}

/**
 * Formatta secondi in "m:ss" o "m:ss.d".
 * 90 → "1:30" | 90.5 → "1:30.5"
 */
export function formatTime(totalSec: number): string {
  if (!totalSec || totalSec <= 0) return '';
  const min    = Math.floor(totalSec / 60);
  const secRaw = totalSec - min * 60;
  const secInt = Math.floor(secRaw);
  const dec    = Math.round((secRaw - secInt) * 10);
  const secStr = secInt.toString().padStart(2, '0');
  return dec > 0 ? `${min}:${secStr}.${dec}` : `${min}:${secStr}`;
}

/**
 * Calcola secondi attesi per una certa distanza al ritmo indicato.
 * ritmo="3:50" (min/km), distanza_m=400 → 92s
 */
export function expectedSeconds(ritmo: string, distanza_m: number): number | null {
  const match = ritmo.match(/^(\d+):(\d{2})$/);
  if (!match) return null;
  const ritmoPer1000 = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  return (ritmoPer1000 * distanza_m) / 1000;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PerformanceLogService {

  private supabase = inject(SupabaseService);

  getLogsForAssignment(assignmentId: string): Observable<PerformanceLogModel[]> {
    return from(
      this.supabase.client
        .from('performance_logs')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('ripetizione_n', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as PerformanceLogModel[];
      })
    );
  }

  /** Sostituisce tutti i log di un'assegnazione (delete + insert). */
  saveLogsForAssignment(assignmentId: string, logs: PerformanceLogInsert[]): Observable<void> {
    return from(
      this.supabase.client
        .from('performance_logs')
        .delete()
        .eq('assignment_id', assignmentId)
    ).pipe(
      switchMap(() => {
        if (logs.length === 0) return of(undefined as void);
        return from(
          this.supabase.client.from('performance_logs').insert(logs)
        ).pipe(
          map(({ error }) => { if (error) throw error; })
        );
      })
    );
  }
}
