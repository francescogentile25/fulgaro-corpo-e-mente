import {
  afterNextRender,
  Component,
  ElementRef,
  OnDestroy,
  signal,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AvatarModule } from 'primeng/avatar';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';

gsap.registerPlugin(ScrollTrigger);

export interface Testimonial {
  initials: string;
  name: string;
  role: string;
  rating: number;
  text: string;
  metric: string;
  metricLabel: string;
}

@Component({
  selector: 'app-testimonials-section',
  imports: [AvatarModule, RatingModule, FormsModule],
  templateUrl: './testimonials-section.html',
  styleUrl: './testimonials-section.scss',
})
export class TestimonialsSection implements OnDestroy {
  protected readonly activeIndex = signal(0);

  protected readonly testimonials: Testimonial[] = [
    {
      initials: 'MA',
      name: 'Marco Alberti',
      role: 'Maratoneta amatoriale',
      rating: 5,
      text: 'In 6 mesi sono passato da 4:45/km a 4:10/km. Il protocollo integrato ha completamente trasformato il mio approccio all\'allenamento. Dati reali, risultati reali.',
      metric: '-35"',
      metricLabel: 'Miglioramento/Km',
    },
    {
      initials: 'SB',
      name: 'Sara Bianchi',
      role: 'Trail runner',
      rating: 5,
      text: 'Finalmente un coach che usa i dati per personalizzare davvero. Niente piani generici copiati da internet. Il mio VO2max è salito di 8 punti in 4 mesi.',
      metric: '+8',
      metricLabel: 'Punti VO2max',
    },
    {
      initials: 'LF',
      name: 'Luca Ferretti',
      role: '10K runner',
      rating: 5,
      text: 'Da runner con infortuni ricorrenti a completare la mia prima mezza maratona senza dolori. Il lavoro sulla tecnica e sulla forza funzionale è stato fondamentale.',
      metric: '21K',
      metricLabel: 'Prima Mezza',
    },
    {
      initials: 'CR',
      name: 'Chiara Rossi',
      role: 'Running principiante',
      rating: 5,
      text: 'Ho iniziato da zero, letteralmente. Dopo 12 settimane con il Protocollo Base corro 5km senza fermarmi e ho perso 6kg. Il supporto del coach è stato impagabile.',
      metric: '5K',
      metricLabel: 'Primo Traguardo',
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
      gsap.from('.testimonials-header', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.testimonials-section', start: 'top 75%' },
      });

      gsap.from('.testimonial-card', {
        y: 50,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.testimonials-grid', start: 'top 80%' },
      });
    }, this.el.nativeElement);
  }

  setActive(index: number): void {
    this.activeIndex.set(index);
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
