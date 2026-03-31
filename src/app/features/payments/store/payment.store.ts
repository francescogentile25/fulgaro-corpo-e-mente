import { computed, effect, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { addEntities, removeEntity, setAllEntities, setEntity, updateEntity, withEntities } from '@ngrx/signals/entities';
import { MessageService } from 'primeng/api';
import { SpinLoaderService } from '../../../core/services/spin-loader.service';
import { PaymentService } from '../services/payment.service';
import { PaymentModel, PaymentStato, PaymentWithAtleta } from '../models/payment.model';
import { AuthStore } from '../../auth/store/auth.store';
import { NotificationStore } from '../../notifications/store/notification.store';

type PaymentState = {
  loading:  boolean;
  error:    string | undefined;
};

export const PaymentStore = signalStore(
  { providedIn: 'root' },
  withEntities<PaymentWithAtleta>(),
  withState<PaymentState>({ loading: false, error: undefined }),

  withComputed(({ entities }) => ({
    comunicati:  computed(() => entities().filter(p => p.stato === 'comunicato').length),
    confermati:  computed(() => entities().filter(p => p.stato === 'confermato').length),
    nonPagati:   computed(() => entities().filter(p => p.stato === 'non_pagato').length),
  })),

  withMethods((
    store,
    service       = inject(PaymentService),
    messageService = inject(MessageService),
    loaderService  = inject(SpinLoaderService),
    notifStore     = inject(NotificationStore),
  ) => ({

    // ─── CARICAMENTO ────────────────────────────────────────────────────────

    loadForAdmin(mese: number, anno: number): void {
      patchState(store, { loading: true, error: undefined });
      loaderService.startSpinLoader();
      service.getAllForAdmin(mese, anno).subscribe({
        next: (payments) => {
          patchState(store, setAllEntities(payments), { loading: false });
          loaderService.stopSpinLoader();
        },
        error: (err: Error) => {
          messageService.add({ severity: 'error', summary: 'Errore', detail: err.message });
          patchState(store, { loading: false, error: err.message });
          loaderService.stopSpinLoader();
        },
      });
    },

    loadForAtleta(): void {
      patchState(store, { loading: true, error: undefined });
      loaderService.startSpinLoader();
      service.getMyPayments().subscribe({
        next: (payments) => {
          // Per l'atleta non c'è il campo atleta join → cast esplicito a PaymentWithAtleta
          const withAtleta: PaymentWithAtleta[] = payments.map(p => ({ ...p, atleta: null as PaymentWithAtleta['atleta'] }));
          patchState(store, setAllEntities(withAtleta), { loading: false });
          loaderService.stopSpinLoader();
        },
        error: (err: Error) => {
          messageService.add({ severity: 'error', summary: 'Errore', detail: err.message });
          patchState(store, { loading: false, error: err.message });
          loaderService.stopSpinLoader();
        },
      });
    },

    // ─── AZIONI ─────────────────────────────────────────────────────────────

    comunicaPagamento(
      atletaId: string,
      mese: number,
      anno: number,
      note: string | null,
      atletaNome: string,
      atletaCognome: string,
      onSuccess?: () => void
    ): void {
      patchState(store, { loading: true });
      loaderService.startSpinLoader();
      service.comunicaPagamento(atletaId, mese, anno, note, atletaNome, atletaCognome).subscribe({
        next: (payment) => {
          const updated: PaymentWithAtleta = { ...payment, atleta: null };
          // Upsert nello store locale
          patchState(store, setEntity(updated), { loading: false });
          loaderService.stopSpinLoader();
          messageService.add({
            severity: 'success',
            summary:  'Pagamento comunicato',
            detail:   'Il tuo pagamento è stato comunicato all\'amministratore.',
          });
          onSuccess?.();
        },
        error: (err: Error) => {
          messageService.add({ severity: 'error', summary: 'Errore', detail: err.message });
          patchState(store, { loading: false, error: err.message });
          loaderService.stopSpinLoader();
        },
      });
    },

    confermaPagamento(
      id: string,
      atletaId: string,
      mese: number,
      anno: number,
      atletaNomeCognome: string
    ): void {
      patchState(store, { loading: true });
      loaderService.startSpinLoader();
      service.confermaPagamento(id, atletaId, mese, anno).subscribe({
        next: (payment) => {
          // Aggiorna l'entità: mantieni il campo atleta esistente
          const existing = store.entityMap()[id];
          const updated: PaymentWithAtleta = { ...payment, atleta: existing?.atleta ?? null };
          patchState(store, setEntity(updated), { loading: false });
          loaderService.stopSpinLoader();
          messageService.add({
            severity: 'success',
            summary:  'Pagamento confermato',
            detail:   `Pagamento di ${atletaNomeCognome} confermato.`,
          });
          // Ricarica le notifiche per mostrare quella appena inviata all'atleta
          notifStore.getAll$();
        },
        error: (err: Error) => {
          messageService.add({ severity: 'error', summary: 'Errore', detail: err.message });
          patchState(store, { loading: false, error: err.message });
          loaderService.stopSpinLoader();
        },
      });
    },

    // ─── CHECK LOGIN ─────────────────────────────────────────────────────────

    checkLoginAlert(atletaId: string, atletaNome: string, atletaCognome: string): void {
      service.checkLoginAlert(atletaId, atletaNome, atletaCognome).subscribe({
        next: () => { /* silenzioso */ },
        error: () => { /* non mostrare errori all'utente per questo check */ },
      });
    },
  })),

  withHooks({
    onInit(store) {
      const authStore = inject(AuthStore);

      effect(() => {
        const user = authStore.user();
        if (!user) return;

        if (user.ruolo === 'admin') {
          const today = new Date();
          store.loadForAdmin(today.getMonth() + 1, today.getFullYear());
        } else if (user.ruolo === 'atleta') {
          store.loadForAtleta();
          store.checkLoginAlert(user.id, user.nome, user.cognome);
        }
      });
    },
  })
);
