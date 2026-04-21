import {
  afterNextRender,
  Component,
  computed,
  HostListener,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { globalPaths } from '../../../_config/global-paths.config';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-nav-bar',
  imports: [ButtonModule, DrawerModule, RouterLink],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar implements OnDestroy {
  private router = inject(Router);
  themeService = inject(ThemeService);

  protected readonly isScrolled = signal(false);
  protected readonly mobileMenuOpen = signal(false);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  protected readonly isHome = computed(() => {
    const url = this.currentUrl();
    return url === '/' || url.startsWith('/#') || url.startsWith('/?');
  });

  readonly loginUrl = globalPaths.loginUrl;
  readonly articlesUrl = globalPaths.articlesPublicUrl;

  protected readonly navLinks = [
    { label: 'Filosofia', fragment: 'filosofia' },
    { label: 'Programmi', fragment: 'programmi' },
    { label: 'Dove Alleno', fragment: 'dove-alleno' },
    { label: 'Contatti', fragment: 'cta' },
  ];

  constructor() {
    afterNextRender(() => {
      this.onScroll();
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 60);
  }

  goToSection(fragment: string): void {
    this.mobileMenuOpen.set(false);
    if (this.isHome()) {
      const el = document.getElementById(fragment);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      this.router.navigate(['/'], { fragment });
    }
  }

  ngOnDestroy(): void {}
}
