import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
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

  private ctx!: gsap.Context;
  private momentsAnimated = false;

  constructor() {
    afterNextRender(() => {
      this.ctx = gsap.context(() => {
        gsap.from('.race-moment-header', {
          y: 50,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.race-moment-section', start: 'top 75%' },
        });
      }, this.el.nativeElement);
    });

    effect(() => {
      const entities = this.store.entities();
      if (entities.length > 0 && !this.momentsAnimated) {
        this.momentsAnimated = true;
        setTimeout(() => {
          gsap.from('.moment-cell', {
            y: 40,
            opacity: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.moments-grid', start: 'top 80%' },
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
  }
}
