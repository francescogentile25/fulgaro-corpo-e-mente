import { Component, HostBinding, HostListener, inject, effect } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../auth/store/auth.store';
import { LayoutService } from '../../../core/services/layout.service';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { globalPaths } from '../../_config/global-paths.config';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
  atletaOnly?: boolean;
  comingSoon?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, ButtonModule, DividerModule, AvatarModule, TooltipModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  authStore     = inject(AuthStore);
  layoutService = inject(LayoutService);

  @HostBinding('class.sidebar--open')
  get isOpen(): boolean { return this.layoutService.sidebarOpen(); }

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',      icon: 'pi-chart-bar',   route: globalPaths.dashboardUrl },
    // Admin
    { label: 'Schede',         icon: 'pi-calendar',    route: globalPaths.schedeUrl,        adminOnly: true },
    { label: 'Atleti',         icon: 'pi-users',       route: globalPaths.athletesUrl,      adminOnly: true },
    { label: 'Gruppi',         icon: 'pi-sitemap',     route: globalPaths.groupsUrl,        adminOnly: true },
    { label: 'Articoli',       icon: 'pi-file-edit',   route: globalPaths.articlesAdminUrl, adminOnly: true },
    // Atleta
    { label: 'La mia scheda',  icon: 'pi-calendar',    route: globalPaths.miaSchedaUrl,     atletaOnly: true },
    // Tutti
    { label: 'Notifiche',      icon: 'pi-bell',        route: globalPaths.notificationsUrl },
    { label: 'Pagamenti',      icon: 'pi-credit-card', route: globalPaths.paymentsUrl },
  ];

  get visibleItems(): NavItem[] {
    return this.navItems.filter(item => {
      if (item.adminOnly  && !this.authStore.isAdmin())   return false;
      if (item.atletaOnly && !this.authStore.isAtleta())  return false;
      return true;
    });
  }

  get userInitial(): string {
    return this.authStore.userName().charAt(0).toUpperCase();
  }

  // Chiudi sidebar su mobile quando si clicca un link
  closeOnMobile(): void {
    if (window.innerWidth < 1024) {
      this.layoutService.closeSidebar();
    }
  }

  logout(): void {
    this.authStore.logout$();
  }

  // Chiudi con ESC su mobile
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (window.innerWidth < 1024) {
      this.layoutService.closeSidebar();
    }
  }
}
