import { computed, effect, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods } from '@ngrx/signals';
import { addEntity, updateEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MessageService } from 'primeng/api';
import { createEntityStoreConfig } from '../../../core/store/base.store';
import { NotificationService } from '../services/notification.service';
import { NotificationCreateRequest, NotificationModel } from '../models/notification.model';
import { AuthStore } from '../../auth/store/auth.store';
import { SupabaseService } from '../../../core/services/supabase.service';

export const NotificationStore = signalStore(
  { providedIn: 'root' },
  ...createEntityStoreConfig<NotificationModel, NotificationCreateRequest>({
    storeName: 'Notifiche',
    serviceToken: NotificationService,
    showSuccessMessages: false,
    showErrorMessages: true,
  }),

  withComputed(({ entities }) => ({
    unreadCount: computed(() => entities().filter(n => !n.letta).length),
  })),

  withMethods((store, service = inject(NotificationService), messageService = inject(MessageService)) => ({

    markAsRead$(id: string): void {
      service.markAsRead(id).subscribe({
        next: () => {
          patchState(store, updateEntity({ id, changes: { letta: true } }));
        },
        error: () => {
          messageService.add({ severity: 'error', summary: 'Errore', detail: 'Impossibile aggiornare la notifica' });
        }
      });
    },

    markAllAsRead$: rxMethod<string>(
      pipe(
        switchMap((destinatarioId) =>
          service.markAllAsRead(destinatarioId).pipe(
            tapResponse({
              next: () => {
                // Aggiorna tutte le entità nello store come lette
                store.entities().forEach(n => {
                  if (!n.letta) {
                    patchState(store, updateEntity({ id: n.id, changes: { letta: true } }));
                  }
                });
              },
              error: () => {
                messageService.add({ severity: 'error', summary: 'Errore', detail: 'Impossibile aggiornare le notifiche' });
              }
            })
          )
        )
      )
    ),
  })),

  withHooks({
    onInit(store) {
      const authStore  = inject(AuthStore);
      const supabase   = inject(SupabaseService);
      let channel: ReturnType<typeof supabase.client.channel> | null = null;

      effect(() => {
        const user = authStore.user();

        // Rimuovi canale precedente
        if (channel) {
          supabase.client.removeChannel(channel);
          channel = null;
        }

        if (user) {
          // Carica notifiche dell'utente corrente
          store.getAll$();

          // Sottoscrivi Realtime: solo INSERT per questo utente
          channel = supabase.client
            .channel(`notifications-${user.id}`)
            .on(
              'postgres_changes' as any,
              {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `destinatario_id=eq.${user.id}`,
              },
              (payload: any) => {
                patchState(store, addEntity(payload.new as NotificationModel));
              }
            )
            .subscribe();
        }
      });
    }
  })
);
