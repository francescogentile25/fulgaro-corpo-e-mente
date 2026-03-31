import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { PaymentStore } from '../store/payment.store';
import { AuthStore } from '../../auth/store/auth.store';
import { getMeseLabel, PaymentWithAtleta } from '../models/payment.model';

@Component({
  selector: 'app-payments-page',
  imports: [ButtonModule, DialogModule, TextareaModule, TooltipModule, FormsModule, DatePipe],
  templateUrl: './payments-page.html',
  styleUrl: './payments-page.scss',
})
export class PaymentsPage {
  paymentStore       = inject(PaymentStore);
  authStore          = inject(AuthStore);
  confirmationService = inject(ConfirmationService);

  // ─── NAVIGAZIONE MESI (admin) ───────────────────────────────────────────────
  currentMese = signal(new Date().getMonth() + 1);
  currentAnno = signal(new Date().getFullYear());

  get currentMonthLabel(): string {
    return `${getMeseLabel(this.currentMese())} ${this.currentAnno()}`;
  }

  prevMonth(): void {
    if (this.currentMese() === 1) {
      this.currentMese.set(12);
      this.currentAnno.update(a => a - 1);
    } else {
      this.currentMese.update(m => m - 1);
    }
    this.paymentStore.loadForAdmin(this.currentMese(), this.currentAnno());
  }

  nextMonth(): void {
    if (this.currentMese() === 12) {
      this.currentMese.set(1);
      this.currentAnno.update(a => a + 1);
    } else {
      this.currentMese.update(m => m + 1);
    }
    this.paymentStore.loadForAdmin(this.currentMese(), this.currentAnno());
  }

  // ─── VISTA ATLETA ─────────────────────────────────────────────────────────
  readonly todayMese = new Date().getMonth() + 1;
  readonly todayAnno = new Date().getFullYear();

  get currentMonthPayment(): PaymentWithAtleta | undefined {
    return this.paymentStore.entities().find(
      p => p.mese === this.todayMese && p.anno === this.todayAnno
    );
  }

  get paymentHistory(): PaymentWithAtleta[] {
    return this.paymentStore.entities().filter(
      p => !(p.mese === this.todayMese && p.anno === this.todayAnno)
    );
  }

  // ─── DIALOG COMUNICA PAGAMENTO ────────────────────────────────────────────
  dialogVisible = signal(false);
  dialogNote    = '';

  openComunicaDialog(): void {
    this.dialogNote    = '';
    this.dialogVisible.set(true);
  }

  submitComunicaPagamento(): void {
    const user = this.authStore.user();
    if (!user) return;
    this.paymentStore.comunicaPagamento(
      user.id,
      this.todayMese,
      this.todayAnno,
      this.dialogNote.trim() || null,
      user.nome,
      user.cognome,
      () => this.dialogVisible.set(false)
    );
  }

  // ─── CONFERMA PAGAMENTO (admin) ────────────────────────────────────────────
  confirmPayment(payment: PaymentWithAtleta, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Confermare il pagamento di ${payment.atleta?.nome} ${payment.atleta?.cognome} per ${getMeseLabel(payment.mese)} ${payment.anno}?`,
      header:  'Conferma pagamento',
      icon:    'pi pi-check-circle',
      accept:  () => {
        this.paymentStore.confermaPagamento(
          payment.id,
          payment.atleta_id,
          payment.mese,
          payment.anno,
          `${payment.atleta?.nome ?? ''} ${payment.atleta?.cognome ?? ''}`.trim()
        );
      },
    });
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  getMeseLabel = getMeseLabel;

  getStatoLabel(stato: string): string {
    const map: Record<string, string> = {
      non_pagato: 'Non pagato',
      comunicato: 'Comunicato',
      confermato: 'Confermato',
    };
    return map[stato] ?? stato;
  }

  getStatoClass(stato: string): string {
    const map: Record<string, string> = {
      non_pagato: 'stato--non-pagato',
      comunicato: 'stato--comunicato',
      confermato: 'stato--confermato',
    };
    return map[stato] ?? '';
  }
}
