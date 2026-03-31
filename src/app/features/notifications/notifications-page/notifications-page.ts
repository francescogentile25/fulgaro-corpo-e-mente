import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { NotificationStore } from '../store/notification.store';
import { AuthStore } from '../../auth/store/auth.store';
import { NotificationModel, NotificationType } from '../models/notification.model';

@Component({
  selector: 'app-notifications-page',
  imports: [ButtonModule, DividerModule, DatePipe],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.scss',
})
export class NotificationsPage {
  notificationStore = inject(NotificationStore);
  authStore         = inject(AuthStore);

  markAsRead(notification: NotificationModel): void {
    if (!notification.letta) {
      this.notificationStore.markAsRead$(notification.id);
    }
  }

  markAllAsRead(): void {
    const userId = this.authStore.user()?.id;
    if (userId) {
      this.notificationStore.markAllAsRead$(userId);
    }
  }

  getIcon(tipo: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      esercizio_assegnato: 'pi pi-calendar-plus',
      pagamento_ricevuto:  'pi pi-check-circle',
      pagamento_scaduto:   'pi pi-exclamation-circle',
      custom:              'pi pi-info-circle',
    };
    return icons[tipo] ?? 'pi pi-bell';
  }

  getIconColor(tipo: NotificationType): string {
    const colors: Record<NotificationType, string> = {
      esercizio_assegnato: '#3b82f6',
      pagamento_ricevuto:  '#22c55e',
      pagamento_scaduto:   '#ef4444',
      custom:              '#8b5cf6',
    };
    return colors[tipo] ?? '#64748b';
  }

  getTipoLabel(tipo: NotificationType): string {
    const labels: Record<NotificationType, string> = {
      esercizio_assegnato: 'Esercizio assegnato',
      pagamento_ricevuto:  'Pagamento ricevuto',
      pagamento_scaduto:   'Pagamento scaduto',
      custom:              'Notifica',
    };
    return labels[tipo] ?? tipo;
  }
}
