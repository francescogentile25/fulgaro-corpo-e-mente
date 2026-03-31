import { inject, Injectable } from '@angular/core';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthStore } from '../../auth/store/auth.store';
import { BaseEntityService } from '../../../core/store/base.store';
import { ExerciseModel } from '../models/exercise.model';
import { ExerciseCreateRequest, ExerciseUpdateRequest } from '../models/requests/exercise-request.model';

@Injectable({ providedIn: 'root' })
export class ExerciseService implements BaseEntityService<ExerciseModel, ExerciseCreateRequest, ExerciseUpdateRequest> {

  private supabase   = inject(SupabaseService);
  private authStore  = inject(AuthStore);

  // ── Leggi ────────────────────────────────────────────────

  getAll(): Observable<ExerciseModel[]> {
    return from(
      this.supabase.client
        .from('exercises')
        .select('*, exercise_blocks(*)')
        .order('created_at', { ascending: false })
        .order('ordine', { referencedTable: 'exercise_blocks', ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as ExerciseModel[];
      })
    );
  }

  // ── Crea ─────────────────────────────────────────────────

  add(request: ExerciseCreateRequest): Observable<ExerciseModel> {
    const { blocks, ...exerciseData } = request;
    const payload = { ...exerciseData, created_by: this.authStore.user()?.id ?? null };

    return from(
      this.supabase.client.from('exercises').insert(payload).select().single()
    ).pipe(
      switchMap(({ data: exercise, error }) => {
        if (error) throw error;

        const toInsert = (blocks ?? []).map((b, i) => ({
          ...b,
          exercise_id: exercise.id,
          ordine: i + 1,
        }));

        if (toInsert.length === 0) {
          return of({ ...exercise, exercise_blocks: [] } as ExerciseModel);
        }

        return from(
          this.supabase.client.from('exercise_blocks').insert(toInsert).select()
        ).pipe(
          map(({ data: insertedBlocks, error: err2 }) => {
            if (err2) throw err2;
            return { ...exercise, exercise_blocks: insertedBlocks ?? [] } as ExerciseModel;
          })
        );
      })
    );
  }

  // ── Modifica ─────────────────────────────────────────────

  edit(request: ExerciseUpdateRequest): Observable<ExerciseModel> {
    const { id, blocks, ...updateData } = request;

    return from(
      this.supabase.client.from('exercises').update(updateData).eq('id', id).select().single()
    ).pipe(
      switchMap(({ data: exercise, error }) => {
        if (error) throw error;

        // Elimina i blocchi esistenti e reinserisci
        return from(
          this.supabase.client.from('exercise_blocks').delete().eq('exercise_id', id)
        ).pipe(
          switchMap(() => {
            const toInsert = (blocks ?? []).map((b, i) => ({
              ...b,
              exercise_id: id,
              ordine: i + 1,
            }));

            if (toInsert.length === 0) {
              return of({ ...exercise, exercise_blocks: [] } as ExerciseModel);
            }

            return from(
              this.supabase.client.from('exercise_blocks').insert(toInsert).select()
            ).pipe(
              map(({ data: newBlocks, error: err3 }) => {
                if (err3) throw err3;
                return { ...exercise, exercise_blocks: newBlocks ?? [] } as ExerciseModel;
              })
            );
          })
        );
      })
    );
  }

  // ── Elimina ───────────────────────────────────────────────

  delete(id: string): Observable<void> {
    // Elimina prima i blocchi, poi l'esercizio
    return from(
      this.supabase.client.from('exercise_blocks').delete().eq('exercise_id', id)
    ).pipe(
      switchMap(() =>
        from(this.supabase.client.from('exercises').delete().eq('id', id))
      ),
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }
}
