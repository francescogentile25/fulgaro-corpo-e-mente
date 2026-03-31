import { inject, Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { BaseEntityService } from '../../../core/store/base.store';
import { ProfileModel } from '../../auth/models/responses/profile.model';
import { AtletaUpdateRequest } from '../models/requests/atleta-request.model';

@Injectable({ providedIn: 'root' })
export class AtletaService implements BaseEntityService<ProfileModel, Omit<ProfileModel, 'id'>, AtletaUpdateRequest> {

  private supabase = inject(SupabaseService);

  // Carica tutti i profili con ruolo 'atleta'
  getAll(): Observable<ProfileModel[]> {
    return from(
      this.supabase.client
        .from('profiles')
        .select('*')
        .eq('ruolo', 'atleta')
        .order('cognome', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as ProfileModel[];
      })
    );
  }

  // Modifica i campi gestibili dall'admin su un profilo atleta
  edit(request: AtletaUpdateRequest): Observable<ProfileModel> {
    const { id, ...fields } = request;
    return from(
      this.supabase.client
        .from('profiles')
        .update(fields)
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as ProfileModel;
      })
    );
  }

  // Elimina il profilo (non elimina l'utente Auth — farlo dalla dashboard Supabase)
  delete(id: string): Observable<void> {
    return from(
      this.supabase.client
        .from('profiles')
        .delete()
        .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }
}
