import {
  afterNextRender,
  Component,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface RaceMoment {
  image: string;
  label: string;
  description: string;
  span: string;
}

@Component({
  selector: 'app-race-moment-section',
  imports: [],
  templateUrl: './race-moment-section.html',
  styleUrl: './race-moment-section.scss',
})
export class RaceMomentSection implements OnDestroy {
  protected readonly moments: RaceMoment[] = [
    {
      image: '/assets/img/sprint-finale.webp',
      label: 'Sprint finale',
      description: 'Gli ultimi 400 metri dove tutto si decide',
      span: 'col-span-2 row-span-2',
    },
    {
      image: 'https://images.unsplash.com/photo-1486218119243-13883505764c?w=600&q=80&fit=crop',
      label: 'Alba sul percorso',
      description: 'Le uscite mattutine che formano il carattere',
      span: 'col-span-1 row-span-1',
    },
    {
      image: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&q=80&fit=crop',
      label: 'Allenamento di gruppo',
      description: 'La forza del team quando i km si fanno duri',
      span: 'col-span-1 row-span-1',
    },
    {
      image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&q=80&fit=crop',
      label: 'Oltre il limite',
      description: 'Quando la mente comanda e il corpo esegue',
      span: 'col-span-1 row-span-2',
    },
    {
      image: 'https://images.unsplash.com/photo-1461896836934-bd45ba9407a6?w=600&q=80&fit=crop',
      label: 'Traguardo raggiunto',
      description: 'Il momento che ripaga mesi di sacrificio',
      span: 'col-span-1 row-span-1',
    },
  ];

  private ctx!: gsap.Context;

  constructor(private el: ElementRef) {
    afterNextRender(() => {
      this.initAnimations();
    });
  }

  private initAnimations(): void {
    this.ctx = gsap.context(() => {
      gsap.from('.race-moment-header', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.race-moment-section', start: 'top 75%' },
      });

      gsap.from('.moment-cell', {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.moments-grid', start: 'top 80%' },
      });
    }, this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
