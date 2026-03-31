import { Component, inject, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { NotificationStore } from '../store/notification.store';
import { AuthStore } from '../../auth/store/auth.store';
import { NotificationModel, NotificationType } from '../models/notification.model';

@Component({
  selector: 'app-notification-drawer',
  imports: [DrawerModule, ButtonModule, BadgeModule, DividerModule, DatePipe],
  templateUrl: './notification-drawer.html',
  styleUrl: './notification-drawer.scss',
})
export class NotificationDrawer {
  visible = input.required<boolean>();
  visibleChange = output<boolean>();

  notificationStore = inject(NotificationStore);
  authStore         = inject(AuthStore);

  close(): void {
    this.visibleChange.emit(false);
  }

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
}
