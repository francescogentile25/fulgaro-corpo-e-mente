import {
  afterNextRender,
  Component,
  ElementRef,
  OnDestroy,
  signal,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Stat {
  value: number;
  suffix: string;
  label: string;
  description: string;
  displayed: ReturnType<typeof signal<number>>;
}

@Component({
  selector: 'app-stats-strip',
  imports: [],
  templateUrl: './stats-strip.html',
  styleUrl: './stats-strip.scss',
})
export class StatsStrip implements OnDestroy {
  protected readonly stats: Stat[] = [
    {
      value: 250,
      suffix: '+',
      label: 'Atleti Seguiti',
      description: 'Runner di ogni livello',
      displayed: signal(0),
    },
    {
      value: 12500,
      suffix: '',
      label: 'Km Analizzati',
      description: 'Dati GPS processati',
      displayed: signal(0),
    },
    {
      value: 89,
      suffix: '%',
      label: 'Tasso di Miglioramento',
      description: 'Entro i primi 3 mesi',
      displayed: signal(0),
    },
    {
      value: 6,
      suffix: '',
      label: 'Programmi Elite',
      description: 'Dal base all\'agonistico',
      displayed: signal(0),
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
      gsap.from('.stats-strip-item', {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.stats-strip-section',
          start: 'top 80%',
        },
      });

      this.stats.forEach((stat) => {
        const proxy = { val: 0 };
        gsap.to(proxy, {
          val: stat.value,
          duration: 2.2,
          ease: 'power2.out',
          onUpdate: () => stat.displayed.set(Math.round(proxy.val)),
          scrollTrigger: {
            trigger: '.stats-strip-section',
            start: 'top 75%',
            once: true,
          },
        });
      });
    }, this.el.nativeElement);
  }

  formatValue(stat: Stat): string {
    const v = stat.displayed();
    if (v >= 1000) {
      return (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + 'K';
    }
    return String(v);
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
