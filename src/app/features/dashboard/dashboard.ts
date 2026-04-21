import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { AuthStore } from '../auth/store/auth.store';
import { NotificationStore } from '../notifications/store/notification.store';
import { PaymentStore } from '../payments/store/payment.store';
import {
  DashboardService,
  AdminStats, AtletaStats, NextWorkout,
  AdminWeeklyStats, AtletaWeeklyKm,
} from './services/dashboard.service';
import { globalPaths } from '../_config/global-paths.config';
import { getMeseLabel } from '../payments/models/payment.model';

const TIPI_LABEL: Record<string, string> = {
  continua:       'Corsa continua',
  intervallato:   'Intervalli',
  potenziamento:  'Potenziamento',
  riposo:         'Riposo',
  gara:           'Gara',
};

// Palette colori grafici
const CHART_COLORS = {
  primary:   'rgba(99,102,241,0.85)',
  success:   'rgba(34,197,94,0.85)',
  warning:   'rgba(234,179,8,0.85)',
  danger:    'rgba(239,68,68,0.85)',
  secondary: 'rgba(148,163,184,0.85)',
  primaryBorder:   'rgb(99,102,241)',
  successBorder:   'rgb(34,197,94)',
  warningBorder:   'rgb(234,179,8)',
  dangerBorder:    'rgb(239,68,68)',
  secondaryBorder: 'rgb(148,163,184)',
};

const BASE_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const, labels: { font: { size: 12 }, padding: 16 } },
    tooltip: { padding: 10 },
  },
};

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, ChartModule, CardModule, SkeletonModule, TagModule],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  authStore        = inject(AuthStore);
  notifStore       = inject(NotificationStore);
  paymentStore     = inject(PaymentStore);
  dashboardService = inject(DashboardService);

  readonly paths = globalPaths;

  loading       = signal(true);
  adminStats    = signal<AdminStats | null>(null);
  atletaStats   = signal<AtletaStats | null>(null);

  adminWeekly   = signal<AdminWeeklyStats | null>(null);
  atletaWeekly  = signal<AtletaWeeklyKm | null>(null);

  // ─── Chart data (admin) ─────────────────────────────────────────────────────

  adminBarData = computed(() => {
    const w = this.adminWeekly();
    if (!w) return null;
    return {
      labels: w.labels,
      datasets: [
        {
          label: 'Assegnati',
          data: w.assigned,
          backgroundColor: CHART_COLORS.primary,
          borderColor: CHART_COLORS.primaryBorder,
          borderRadius: 6,
          borderWidth: 1,
        },
        {
          label: 'Completati',
          data: w.completed,
          backgroundColor: CHART_COLORS.success,
          borderColor: CHART_COLORS.successBorder,
          borderRadius: 6,
          borderWidth: 1,
        },
      ],
    };
  });

  adminDonutData = computed(() => {
    const comunicati = this.paymentStore.comunicati();
    const confermati = this.paymentStore.confermati();
    const nonPagati  = this.paymentStore.nonPagati();
    const total = comunicati + confermati + nonPagati;
    if (total === 0) return null;
    return {
      labels: ['Non pagati', 'Comunicati', 'Confermati'],
      datasets: [{
        data: [nonPagati, comunicati, confermati],
        backgroundColor: [CHART_COLORS.danger, CHART_COLORS.warning, CHART_COLORS.success],
        borderColor:     [CHART_COLORS.dangerBorder, CHART_COLORS.warningBorder, CHART_COLORS.successBorder],
        borderWidth: 2,
        hoverOffset: 6,
      }],
    };
  });

  // ─── Chart data (atleta) ────────────────────────────────────────────────────

  atletaBarData = computed(() => {
    const w = this.atletaWeekly();
    if (!w) return null;
    return {
      labels: w.labels,
      datasets: [{
        label: 'Km percorsi',
        data: w.km,
        backgroundColor: CHART_COLORS.primary,
        borderColor: CHART_COLORS.primaryBorder,
        borderRadius: 6,
        borderWidth: 1,
        fill: false,
      }],
    };
  });

  atletaDonutData = computed(() => {
    const w = this.atletaWeekly();
    if (!w || w.tipoData.length === 0) return null;
    return {
      labels: w.tipoLabels,
      datasets: [{
        data: w.tipoData,
        backgroundColor: [
          CHART_COLORS.primary, CHART_COLORS.success,
          CHART_COLORS.warning, CHART_COLORS.secondary,
          CHART_COLORS.danger,
        ],
        borderWidth: 2,
        hoverOffset: 6,
      }],
    };
  });

  readonly barOptions = {
    ...BASE_CHART_OPTIONS,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { precision: 0 } },
    },
  };

  readonly donutOptions = {
    ...BASE_CHART_OPTIONS,
    maintainAspectRatio: true,
    aspectRatio: 1.3,
    cutout: '65%',
  };

  // ─── Init ───────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const user = this.authStore.user();
    if (!user) return;

    if (user.ruolo === 'admin') {
      this.dashboardService.getAdminStats().subscribe({
        next:  s  => { this.adminStats.set(s); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
      this.dashboardService.getAdminWeeklyStats().subscribe({
        next: w => this.adminWeekly.set(w),
      });
    } else {
      this.dashboardService.getAtletaStats(user.id).subscribe({
        next:  s  => { this.atletaStats.set(s); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
      this.dashboardService.getAtletaWeeklyKm(user.id).subscribe({
        next: w => this.atletaWeekly.set(w),
      });
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  getTipoLabel(tipo: string): string {
    return TIPI_LABEL[tipo] ?? tipo;
  }

  getWorkoutKm(w: NextWorkout): string {
    const e = w.exercise;
    if (!e) return '';
    if (e.tipo === 'gara') return e.distanza_gara_km ? `${e.distanza_gara_km} km` : '';
    return e.distanza_km ? `${e.distanza_km} km` : '';
  }

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

  getPaymentBadge(stato: string | undefined): { label: string; severity: 'danger' | 'warn' | 'success' } {
    const map: Record<string, { label: string; severity: 'danger' | 'warn' | 'success' }> = {
      non_pagato: { label: 'Non pagato', severity: 'danger'  },
      comunicato: { label: 'Comunicato', severity: 'warn'    },
      confermato: { label: 'Confermato', severity: 'success' },
    };
    return map[stato ?? 'non_pagato'] ?? map['non_pagato'];
  }
}
