import { inject, Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { BaseEntityService } from '../../../core/store/base.store';
import { GroupModel } from '../models/group.model';
import { GroupCreateRequest, GroupUpdateRequest } from '../models/requests/group-request.model';

@Injectable({ providedIn: 'root' })
export class GroupService implements BaseEntityService<GroupModel, GroupCreateRequest, GroupUpdateRequest> {

  private supabase = inject(SupabaseService);

  getAll(): Observable<GroupModel[]> {
    return from(
      this.supabase.client
        .from('groups')
        .select('*')
        .order('nome', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as GroupModel[];
      })
    );
  }

  add(request: GroupCreateRequest): Observable<GroupModel> {
    return from(
      this.supabase.client
        .from('groups')
        .insert(request)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as GroupModel;
      })
    );
  }

  edit(request: GroupUpdateRequest): Observable<GroupModel> {
    return from(
      this.supabase.client
        .from('groups')
        .update({ nome: request.nome })
        .eq('id', request.id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as GroupModel;
      })
    );
  }

  delete(id: string): Observable<void> {
    return from(
      this.supabase.client
        .from('groups')
        .delete()
        .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }
}
