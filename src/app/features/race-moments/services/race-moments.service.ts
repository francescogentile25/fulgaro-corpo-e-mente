import { inject, Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { BaseEntityService } from '../../../core/store/base.store';
import { RaceMoment, RaceMomentCreateRequest, RaceMomentUpdateRequest } from '../models/race-moment.model';

const BUCKET = 'race-moments';

@Injectable({ providedIn: 'root' })
export class RaceMomentsService implements BaseEntityService<RaceMoment, RaceMomentCreateRequest, RaceMomentUpdateRequest> {

  private supabase = inject(SupabaseService);

  getAll(): Observable<RaceMoment[]> {
    return from(
      this.supabase.client
        .from('race_moments')
        .select('*')
        .order('order_index', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as RaceMoment[];
      })
    );
  }

  add(request: RaceMomentCreateRequest): Observable<RaceMoment> {
    return from(
      this.supabase.client
        .from('race_moments')
        .insert(request)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as RaceMoment;
      })
    );
  }

  edit(request: RaceMomentUpdateRequest): Observable<RaceMoment> {
    const { id, ...fields } = request;
    return from(
      this.supabase.client
        .from('race_moments')
        .update(fields)
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as RaceMoment;
      })
    );
  }

  delete(id: string): Observable<void> {
    return from(
      this.supabase.client
        .from('race_moments')
        .delete()
        .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  async uploadImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await this.supabase.client.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data } = this.supabase.client.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
}
