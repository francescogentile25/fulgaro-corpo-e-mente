import { inject, Injectable } from '@angular/core';
import { forkJoin, from, map, Observable, of, switchMap } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { getMeseLabel, PaymentModel, PaymentStato, PaymentWithAtleta } from '../models/payment.model';
import { ProfileModel } from '../../auth/models/responses/profile.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private supabase = inject(SupabaseService);

  // ─── LETTURA ────────────────────────────────────────────────────────────────

  /**
   * Admin: carica tutti i pagamenti del mese/anno selezionato.
   * Restituisce anche gli atleti senza record (virtuale, stato=non_pagato).
   */
  getAllForAdmin(mese: number, anno: number): Observable<PaymentWithAtleta[]> {
    return forkJoin({
      athletes: from(
        this.supabase.client
          .from('profiles')
          .select('id, nome, cognome')
          .eq('ruolo', 'atleta')
          .eq('attivo', true)
          .order('cognome', { ascending: true })
      ),
      payments: from(
        this.supabase.client
          .from('payments')
          .select('*')
          .eq('mese', mese)
          .eq('anno', anno)
      ),
    }).pipe(
      map(({ athletes, payments }) => {
        if (athletes.error) throw athletes.error;
        if (payments.error) throw payments.error;

        const athleteList = athletes.data as Pick<ProfileModel, 'id' | 'nome' | 'cognome'>[];
        const paymentList = payments.data as PaymentModel[];

        const result: PaymentWithAtleta[] = athleteList.map(athlete => {
          const payment = paymentList.find(p => p.atleta_id === athlete.id);
          if (payment) {
            return { ...payment, atleta: { nome: athlete.nome, cognome: athlete.cognome } };
          }
          return {
            id:            `__virtual__${athlete.id}`,
            atleta_id:     athlete.id,
            mese,
            anno,
            stato:         'non_pagato' as PaymentStato,
            comunicato_at: null,
            confermato_at: null,
            note:          null,
            created_at:    '',
            atleta:        { nome: athlete.nome, cognome: athlete.cognome },
            isVirtual:     true,
          };
        });

        // Ordine: comunicato → non_pagato → confermato
        const order: Record<PaymentStato, number> = { comunicato: 0, non_pagato: 1, confermato: 2 };
        return result.sort((a, b) => (order[a.stato] ?? 1) - (order[b.stato] ?? 1));
      })
    );
  }

  /** Atleta: carica tutti i propri pagamenti (RLS filtra automaticamente). */
  getMyPayments(): Observable<PaymentModel[]> {
    return from(
      this.supabase.client
        .from('payments')
        .select('*')
        .order('anno',  { ascending: false })
        .order('mese',  { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as PaymentModel[];
      })
    );
  }

  // ─── SCRITTURA ──────────────────────────────────────────────────────────────

  /**
   * Atleta: comunica il pagamento del mese/anno.
   * Upsert (crea o aggiorna) + notifica admin.
   */
  comunicaPagamento(
    atletaId: string,
    mese: number,
    anno: number,
    note: string | null,
    atletaNome: string,
    atletaCognome: string
  ): Observable<PaymentModel> {
    return from(
      this.supabase.client
        .from('payments')
        .upsert(
          {
            atleta_id:     atletaId,
            mese,
            anno,
            stato:         'comunicato',
            comunicato_at: new Date().toISOString(),
            note:          note || null,
          },
          { onConflict: 'atleta_id,mese,anno' }
        )
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as PaymentModel;
      }),
      switchMap(payment =>
        // Notifica admin: pagamento comunicato
        from(
          this.supabase.client
            .from('profiles')
            .select('id')
            .eq('ruolo', 'admin')
            .limit(1)
            .maybeSingle()
        ).pipe(
          switchMap(({ data: admin }) => {
            if (!admin) return of(payment);
            return from(
              this.supabase.client.from('notifications').insert({
                destinatario_id: admin.id,
                tipo:            'pagamento_ricevuto',
                titolo:          'Pagamento comunicato',
                messaggio:       `${atletaNome} ${atletaCognome} ha comunicato il pagamento di ${getMeseLabel(mese)} ${anno}.`,
                ref_id:          `payment_comm_${atletaId}_${anno}_${mese}`,
              })
            ).pipe(map(() => payment));
          })
        )
      )
    );
  }

  /**
   * Admin: conferma il pagamento di un atleta.
   * Aggiorna stato + notifica atleta.
   */
  confermaPagamento(id: string, atletaId: string, mese: number, anno: number): Observable<PaymentModel> {
    return from(
      this.supabase.client
        .from('payments')
        .update({ stato: 'confermato', confermato_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as PaymentModel;
      }),
      switchMap(payment =>
        // Notifica atleta: pagamento confermato
        from(
          this.supabase.client.from('notifications').insert({
            destinatario_id: atletaId,
            tipo:            'pagamento_ricevuto',
            titolo:          'Pagamento confermato',
            messaggio:       `Il tuo pagamento di ${getMeseLabel(mese)} ${anno} è stato confermato.`,
            ref_id:          `payment_conf_${atletaId}_${anno}_${mese}`,
          })
        ).pipe(map(() => payment))
      )
    );
  }

  // ─── CHECK LOGIN ────────────────────────────────────────────────────────────

  /**
   * Chiamato al login di un atleta.
   * Se oggi ≥ 15 e il pagamento del mese corrente non è stato comunicato,
   * inserisce una notifica all'admin (deduplicata via ref_id).
   */
  checkLoginAlert(atletaId: string, atletaNome: string, atletaCognome: string): Observable<void> {
    const today   = new Date();
    const giorno  = today.getDate();
    if (giorno < 15) return of(undefined);

    const mese  = today.getMonth() + 1;
    const anno  = today.getFullYear();
    const refId = `payment_late_${atletaId}_${anno}_${mese}`;

    return forkJoin({
      payment: from(
        this.supabase.client
          .from('payments')
          .select('stato')
          .eq('atleta_id', atletaId)
          .eq('mese', mese)
          .eq('anno', anno)
          .maybeSingle()
      ),
      existingNotif: from(
        this.supabase.client
          .from('notifications')
          .select('id')
          .eq('ref_id', refId)
          .maybeSingle()
      ),
    }).pipe(
      switchMap(({ payment, existingNotif }) => {
        // Pagamento già comunicato/confermato → nessun alert
        if (payment.data && payment.data.stato !== 'non_pagato') return of(undefined);
        // Notifica già inviata → non duplicare
        if (existingNotif.data) return of(undefined);

        // Cerca admin e inserisci notifica
        return from(
          this.supabase.client
            .from('profiles')
            .select('id')
            .eq('ruolo', 'admin')
            .limit(1)
            .maybeSingle()
        ).pipe(
          switchMap(({ data: admin }) => {
            if (!admin) return of(undefined);
            return from(
              this.supabase.client.from('notifications').insert({
                destinatario_id: admin.id,
                tipo:            'pagamento_scaduto',
                titolo:          'Pagamento non comunicato',
                messaggio:       `${atletaNome} ${atletaCognome} non ha ancora comunicato il pagamento di ${getMeseLabel(mese)} ${anno}.`,
                ref_id:          refId,
                data_riferimento:`${anno}-${String(mese).padStart(2, '0')}-15`,
              })
            ).pipe(map(() => undefined as void));
          })
        );
      }),
      map(() => undefined)
    );
  }
}
