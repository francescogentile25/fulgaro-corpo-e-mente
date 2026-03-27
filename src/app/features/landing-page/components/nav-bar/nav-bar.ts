import {
  afterNextRender,
  Component,
  HostListener,
  OnDestroy,
  signal,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';

@Component({
  selector: 'app-nav-bar',
  imports: [ButtonModule, DrawerModule],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar implements OnDestroy {
  protected readonly isScrolled = signal(false);
  protected readonly mobileMenuOpen = signal(false);

  protected readonly navLinks = [
    { label: 'Filosofia', anchor: '#filosofia' },
    { label: 'Programmi', anchor: '#programmi' },
    { label: 'Dove Alleno', anchor: '#dove-alleno' },
    { label: 'Contatti', anchor: '#cta' },
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

  scrollTo(anchor: string): void {
    this.mobileMenuOpen.set(false);
    const el = document.querySelector(anchor);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  ngOnDestroy(): void {}
}
