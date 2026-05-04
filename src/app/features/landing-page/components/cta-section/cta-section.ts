import {
  afterNextRender,
  Component,
  ElementRef,
  OnDestroy,
  signal,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BookingModal } from '../booking-modal/booking-modal';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-cta-section',
  imports: [BookingModal],
  templateUrl: './cta-section.html',
  styleUrl: './cta-section.scss',
})
export class CtaSection implements OnDestroy {
  private ctx!: gsap.Context;
  modalOpen = signal(false);

  constructor(private el: ElementRef) {
    afterNextRender(() => {
      this.initAnimations();
    });
  }

  private initAnimations(): void {
    this.ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: '.cta-section', start: 'top 70%' },
        defaults: { ease: 'power3.out' },
      });

      tl.from('.cta-kicker', { y: 30, opacity: 0, duration: 0.6 })
        .from('.cta-headline .cta-word', { y: 80, opacity: 0, duration: 0.9, stagger: 0.12 }, '-=0.3')
        .from('.cta-sub', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
        .from('.cta-buttons', { y: 20, opacity: 0, duration: 0.6 }, '-=0.3')
        .from('.cta-note', { opacity: 0, duration: 0.5 }, '-=0.2');

      gsap.to('.cta-glow', {
        opacity: 0.6,
        scale: 1.1,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }, this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
