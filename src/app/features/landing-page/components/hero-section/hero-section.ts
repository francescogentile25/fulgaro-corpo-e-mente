import {
  afterNextRender,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { gsap } from 'gsap';

@Component({
  selector: 'app-hero-section',
  imports: [],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss',
})
export class HeroSection implements OnDestroy {
  @ViewChild('kicker', { static: false }) kicker!: ElementRef;
  @ViewChild('headline', { static: false }) headline!: ElementRef;
  @ViewChild('sub', { static: false }) sub!: ElementRef;
  @ViewChild('ctaGroup', { static: false }) ctaGroup!: ElementRef;
  @ViewChild('statsRow', { static: false }) statsRow!: ElementRef;

  private ctx!: gsap.Context;

  constructor(private el: ElementRef) {
    afterNextRender(() => {
      this.initAnimations();
    });
  }

  private initAnimations(): void {
    this.ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.hero-kicker', { y: 30, opacity: 0, duration: 0.7 })
        .from('.hero-headline .word', { y: 80, opacity: 0, duration: 0.9, stagger: 0.12 }, '-=0.3')
        .from('.hero-sub', { y: 20, opacity: 0, duration: 0.7 }, '-=0.4')
        .from('.hero-cta-group', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
        .from('.hero-stats-item', { y: 20, opacity: 0, duration: 0.5, stagger: 0.1 }, '-=0.3');

      gsap.to('.hero-bg-overlay', {
        opacity: 0.55,
        duration: 2,
        ease: 'power2.inOut',
      });
    }, this.el.nativeElement);
  }

  scrollToCta(): void {
    document.querySelector('#cta')?.scrollIntoView({ behavior: 'smooth' });
  }

  scrollToPrograms(): void {
    document.querySelector('#programmi')?.scrollIntoView({ behavior: 'smooth' });
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
