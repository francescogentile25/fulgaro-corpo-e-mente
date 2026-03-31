import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthStore } from '../auth/store/auth.store';
import { NotificationStore } from '../notifications/store/notification.store';
import { PaymentStore } from '../payments/store/payment.store';
import { DashboardService, AdminStats, AtletaStats, NextWorkout } from './services/dashboard.service';
import { globalPaths } from '../_config/global-paths.config';
import { getMeseLabel } from '../payments/models/payment.model';

const TIPI_LABEL: Record<string, string> = {
  continua:       'Corsa continua',
  intervallato:   'Intervalli',
  potenziamento:  'Potenziamento',
  riposo:         'Riposo',
  gara:           'Gara',
};

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  authStore         = inject(AuthStore);
  notifStore        = inject(NotificationStore);
  paymentStore      = inject(PaymentStore);
  dashboardService  = inject(DashboardService);

  readonly paths = globalPaths;

  loading       = signal(true);
  adminStats    = signal<AdminStats | null>(null);
  atletaStats   = signal<AtletaStats | null>(null);

  ngOnInit(): void {
    const user = this.authStore.user();
    if (!user) return;

    if (user.ruolo === 'admin') {
      this.dashboardService.getAdminStats().subscribe({
        next:  (s) => { this.adminStats.set(s); this.loading.set(false); },
        error: ()  => this.loading.set(false),
      });
    } else {
      this.dashboardService.getAtletaStats(user.id).subscribe({
        next:  (s) => { this.atletaStats.set(s); this.loading.set(false); },
        error: ()  => this.loading.set(false),
      });
    }
  }

  // ─── HELPERS ────────────────────────────────────────────────────────────────

  getTipoLabel(tipo: string): string {
    return TIPI_LABEL[tipo] ?? tipo;
  }

  getWorkoutKm(w: NextWorkout): string {
    const e = w.exercise;
    if (!e) return '';
    if (e.tipo === 'gara') return e.distanza_gara_km ? `${e.distanza_gara_km} km` : '';
    return e.distanza_km ? `${e.distanza_km} km` : '';
  }

  // ─── ATLETA: PAGAMENTO MESE CORRENTE ────────────────────────────────────────

  get currentMonthLabel(): string {
    const today = new Date();
    return `${getMeseLabel(today.getMonth() + 1)} ${today.getFullYear()}`;
  }

  get currentPaymentStato(): string | undefined {
    const today = new Date();
    const m = today.getMonth() + 1;
    const y = today.getFullYear();
    return this.paymentStore.entities().find(p => p.mese === m && p.anno === y)?.stato;
  }

  getPaymentBadge(stato: string | undefined): { label: string; css: string } {
    const map: Record<string, { label: string; css: string }> = {
      non_pagato: { label: 'Non pagato',  css: 'bg-red-100 text-red-700' },
      comunicato: { label: 'Comunicato',  css: 'bg-yellow-100 text-yellow-800' },
      confermato: { label: 'Confermato',  css: 'bg-emerald-100 text-emerald-700' },
    };
    return map[stato ?? 'non_pagato'] ?? map['non_pagato'];
  }
}
