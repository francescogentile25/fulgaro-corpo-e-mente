import {
  afterNextRender,
  Component,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-philosophy-section',
  imports: [],
  templateUrl: './philosophy-section.html',
  styleUrl: './philosophy-section.scss',
})
export class PhilosophySection implements OnDestroy {
  private ctx!: gsap.Context;

  constructor(private el: ElementRef) {
    afterNextRender(() => {
      this.initAnimations();
    });
  }

  private initAnimations(): void {
    this.ctx = gsap.context(() => {
      gsap.from('.philosophy-kicker', {
        x: -40,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.philosophy-section', start: 'top 75%' },
      });

      gsap.from('.philosophy-headline', {
        y: 60,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.philosophy-section', start: 'top 70%' },
      });

      gsap.from('.philosophy-body', {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.philosophy-section', start: 'top 65%' },
      });

      gsap.from('.philosophy-image', {
        x: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.philosophy-section', start: 'top 70%' },
      });

      gsap.from('.philosophy-pillar', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.philosophy-pillars', start: 'top 80%' },
      });
    }, this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
