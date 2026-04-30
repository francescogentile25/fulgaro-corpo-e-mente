import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RaceMomentsStore } from '../../../race-moments/store/race-moments.store';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-race-moment-section',
  imports: [],
  templateUrl: './race-moment-section.html',
  styleUrl: './race-moment-section.scss',
})
export class RaceMomentSection implements OnDestroy, OnInit {
  protected readonly store = inject(RaceMomentsStore);
  private readonly el = inject(ElementRef);

  protected readonly track = viewChild<ElementRef<HTMLElement>>('track');
  protected readonly activeIndex = signal(0);

  protected readonly progressPct = computed(() => {
    const total = this.store.entities().length;
    if (total <= 1) return 100;
    return ((this.activeIndex() + 1) / total) * 100;
  });

  private ctx!: gsap.Context;
  private momentsAnimated = false;
  private scrollRaf: number | null = null;

  constructor() {
    afterNextRender(() => {
      this.ctx = gsap.context(() => {
        gsap.from('.race-moment-header > div > div', {
          y: 40,
          opacity: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.race-moment-section', start: 'top 78%' },
        });
      }, this.el.nativeElement);
    });

    effect(() => {
      const entities = this.store.entities();
      if (entities.length > 0 && !this.momentsAnimated) {
        this.momentsAnimated = true;
        setTimeout(() => {
          gsap.from('.moment-card', {
            y: 60,
            opacity: 0,
            duration: 0.9,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.moments-carousel-wrap', start: 'top 82%' },
          });
          gsap.from('.moments-controls', {
            y: 20,
            opacity: 0,
            duration: 0.7,
            delay: 0.3,
            ease: 'power2.out',
            scrollTrigger: { trigger: '.moments-carousel-wrap', start: 'top 82%' },
          });
        }, 0);
      }
    });
  }

  ngOnInit(): void {
    this.store.getAll$();
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
    if (this.scrollRaf !== null) cancelAnimationFrame(this.scrollRaf);
  }

  protected onScroll(): void {
    if (this.scrollRaf !== null) cancelAnimationFrame(this.scrollRaf);
    this.scrollRaf = requestAnimationFrame(() => this.computeActiveIndex());
  }

  private computeActiveIndex(): void {
    const trackEl = this.track()?.nativeElement;
    if (!trackEl) return;
    const cards = Array.from(trackEl.querySelectorAll<HTMLElement>('.moment-card'));
    if (cards.length === 0) return;

    const center = trackEl.scrollLeft + trackEl.clientWidth / 2;
    let bestIdx = 0;
    let bestDist = Infinity;

    cards.forEach((card, i) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cardCenter - center);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    });

    if (bestIdx !== this.activeIndex()) this.activeIndex.set(bestIdx);
  }

  protected goTo(index: number): void {
    const trackEl = this.track()?.nativeElement;
    if (!trackEl) return;
    const card = trackEl.querySelectorAll<HTMLElement>('.moment-card')[index];
    if (!card) return;
    const target = card.offsetLeft - (trackEl.clientWidth - card.offsetWidth) / 2;
    trackEl.scrollTo({ left: target, behavior: 'smooth' });
  }

  protected next(): void {
    const total = this.store.entities().length;
    this.goTo(Math.min(this.activeIndex() + 1, total - 1));
  }

  protected prev(): void {
    this.goTo(Math.max(this.activeIndex() - 1, 0));
  }

  protected formatIndex(n: number): string {
    return n.toString().padStart(2, '0');
  }
}
