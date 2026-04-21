import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'app-theme';

  isDark = signal(true);

  constructor() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const dark = saved !== null ? saved === 'dark' : true;
    this.isDark.set(dark);
    this.applyTheme(dark);
  }

  toggle(): void {
    const dark = !this.isDark();
    this.isDark.set(dark);
    localStorage.setItem(this.STORAGE_KEY, dark ? 'dark' : 'light');
    this.applyTheme(dark);
  }

  private applyTheme(dark: boolean): void {
    document.documentElement.classList.toggle('dark', dark);
  }
}
