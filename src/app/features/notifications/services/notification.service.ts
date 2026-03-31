import { inject, Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { BaseEntityService } from '../../../core/store/base.store';
import { NotificationCreateRequest, NotificationModel } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService implements BaseEntityService<NotificationModel, NotificationCreateRequest> {

  private supabase = inject(SupabaseService);

  getAll(): Observable<NotificationModel[]> {
    return from(
      this.supabase.client
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as NotificationModel[];
      })
    );
  }

  add(request: NotificationCreateRequest): Observable<NotificationModel> {
    return from(
      this.supabase.client
        .from('notifications')
        .insert(request)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as NotificationModel;
      })
    );
  }

  markAsRead(id: string): Observable<NotificationModel> {
    return from(
      this.supabase.client
        .from('notifications')
        .update({ letta: true })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as NotificationModel;
      })
    );
  }

  markAllAsRead(destinatarioId: string): Observable<void> {
    return from(
      this.supabase.client
        .from('notifications')
        .update({ letta: true })
        .eq('destinatario_id', destinatarioId)
        .eq('letta', false)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }
}
