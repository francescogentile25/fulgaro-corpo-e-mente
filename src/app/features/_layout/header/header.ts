import { Component, inject, signal } from '@angular/core';
import { AuthStore } from '../../auth/store/auth.store';
import { LayoutService } from '../../../core/services/layout.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationStore } from '../../notifications/store/notification.store';
import { NotificationDrawer } from '../../notifications/notification-drawer/notification-drawer';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-header',
  imports: [ButtonModule, BadgeModule, OverlayBadgeModule, NotificationDrawer, TooltipModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  authStore          = inject(AuthStore);
  layoutService      = inject(LayoutService);
  notificationStore  = inject(NotificationStore);
  themeService       = inject(ThemeService);

  drawerVisible = signal(false);

  openNotifications(): void {
    this.drawerVisible.set(true);
  }
}
