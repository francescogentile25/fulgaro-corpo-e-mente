import { inject, Injectable } from '@angular/core';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthStore } from '../../auth/store/auth.store';
import { WorkoutAssignmentModel } from '../models/workout-assignment.model';
import { ExerciseCreateRequest } from '../../exercises/models/requests/exercise-request.model';

@Injectable({ providedIn: 'root' })
export class ScheduleService {

  private supabase   = inject(SupabaseService);
  private authStore  = inject(AuthStore);

  // ── Lettura settimana atleta ──────────────────────────────

  getAthleteWeek(atletaId: string, fromDate: string, toDate: string): Observable<WorkoutAssignmentModel[]> {
    return from(
      this.supabase.client
        .from('workout_assignments')
        .select('*, exercise:exercises(*, exercise_blocks(*))')
        .eq('atleta_id', atletaId)
        .gte('data_workout', fromDate)
        .lte('data_workout', toDate)
        .order('data_workout', { ascending: true })
        .order('ordine', { referencedTable: 'exercise_blocks', ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as WorkoutAssignmentModel[];
      })
    );
  }

  // ── Crea esercizio + assegnazione in un'unica operazione ──

  createWorkout(atletaId: string, dataWorkout: string, req: ExerciseCreateRequest): Observable<WorkoutAssignmentModel> {
    const { blocks, ...exerciseData } = req;
    const exercisePayload = { ...exerciseData, created_by: this.authStore.user()?.id ?? null };

    return from(
      this.supabase.client.from('exercises').insert(exercisePayload).select().single()
    ).pipe(
      switchMap(({ data: exercise, error }) => {
        if (error) throw error;

        const toInsert = (blocks ?? []).map((b, i) => ({
          ...b,
          exercise_id: exercise.id,
          ordine: i + 1,
        }));

        const blocks$ = toInsert.length === 0
          ? of([] as any[])
          : from(this.supabase.client.from('exercise_blocks').insert(toInsert).select()).pipe(
              map(({ data: blks, error: e }) => {
                if (e) throw e;
                return blks ?? [];
              })
            );

        return blocks$.pipe(
          switchMap(exercise_blocks =>
            from(
              this.supabase.client.from('workout_assignments').insert({
                exercise_id:  exercise.id,
                atleta_id:    atletaId,
                data_workout: dataWorkout,
                completato:   false,
                assigned_by:  this.authStore.user()?.id ?? null,
              }).select().single()
            ).pipe(
              map(({ data: assignment, error: e2 }) => {
                if (e2) throw e2;
                return {
                  ...assignment,
                  exercise: { ...exercise, exercise_blocks },
                } as WorkoutAssignmentModel;
              })
            )
          )
        );
      })
    );
  }

  // ── Aggiorna esercizio esistente ──────────────────────────

  updateWorkout(assignmentId: string, exerciseId: string, req: ExerciseCreateRequest): Observable<WorkoutAssignmentModel> {
    const { blocks, ...exerciseData } = req;

    return from(
      this.supabase.client.from('exercises').update(exerciseData).eq('id', exerciseId).select().single()
    ).pipe(
      switchMap(({ data: exercise, error }) => {
        if (error) throw error;

        return from(
          this.supabase.client.from('exercise_blocks').delete().eq('exercise_id', exerciseId)
        ).pipe(
          switchMap(() => {
            const toInsert = (blocks ?? []).map((b, i) => ({
              ...b,
              exercise_id: exerciseId,
              ordine: i + 1,
            }));

            const blocks$ = toInsert.length === 0
              ? of([] as any[])
              : from(this.supabase.client.from('exercise_blocks').insert(toInsert).select()).pipe(
                  map(({ data, error: e }) => {
                    if (e) throw e;
                    return data ?? [];
                  })
                );

            return blocks$.pipe(
              switchMap(exercise_blocks =>
                from(
                  this.supabase.client.from('workout_assignments').select().eq('id', assignmentId).single()
                ).pipe(
                  map(({ data: assignment, error: e }) => {
                    if (e) throw e;
                    return {
                      ...assignment,
                      exercise: { ...exercise, exercise_blocks },
                    } as WorkoutAssignmentModel;
                  })
                )
              )
            );
          })
        );
      })
    );
  }

  // ── Aggiorna stato assegnazione (completato + note atleta) ─

  updateAssignment(
    assignmentId: string,
    data: { completato: boolean; note_atleta: string | null }
  ): Observable<WorkoutAssignmentModel> {
    return from(
      this.supabase.client
        .from('workout_assignments')
        .update(data)
        .eq('id', assignmentId)
        .select('*, exercise:exercises(*, exercise_blocks(*))')
        .single()
    ).pipe(
      map(({ data: assignment, error }) => {
        if (error) throw error;
        return assignment as WorkoutAssignmentModel;
      })
    );
  }

  // ── Elimina assegnazione + esercizio ──────────────────────

  deleteWorkout(assignmentId: string, exerciseId: string): Observable<void> {
    return from(
      this.supabase.client.from('workout_assignments').delete().eq('id', assignmentId)
    ).pipe(
      switchMap(() =>
        from(this.supabase.client.from('exercise_blocks').delete().eq('exercise_id', exerciseId))
      ),
      switchMap(() =>
        from(this.supabase.client.from('exercises').delete().eq('id', exerciseId))
      ),
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }
}
