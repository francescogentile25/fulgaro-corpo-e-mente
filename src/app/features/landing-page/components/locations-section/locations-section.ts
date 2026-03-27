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

export interface Schedule {
  days: string;
  time: string;
}

export interface TrainingLocation {
  id: string;
  name: string;
  image: string;
  schedules: Schedule[];
  personalNote: boolean;
  isOnline: boolean;
}

@Component({
  selector: 'app-locations-section',
  imports: [],
  templateUrl: './locations-section.html',
  styleUrl: './locations-section.scss',
})
export class LocationsSection implements OnDestroy {
  protected readonly activeLocation = signal<string | null>(null);

  protected readonly locations: TrainingLocation[] = [
    {
      id: 'tor-di-quinto',
      name: 'Quinto',
      image: 'assets/img/tor-di-quinto.webp',
      schedules: [
        { days: 'Lun · Mer · Ven', time: '7:30 — 10:00' },
        { days: 'Lun · Ven', time: '13:00 — 14:00' },
      ],
      personalNote: true,
      isOnline: false,
    },
    {
      id: 'sapienza',
      name: 'Sapienza Sport',
      image: 'assets/img/sapienza.jpg',
      schedules: [
        { days: 'Lun · Mer · Ven', time: '18:15 — 19:45' },
      ],
      personalNote: true,
      isOnline: false,
    },
    {
      id: 'villa-gordiani',
      name: 'Villa Gordiani',
      image: 'assets/img/villa-gordiani.jpg',
      schedules: [
        { days: 'Mar · Gio', time: '19:00 — 20:00' },
      ],
      personalNote: true,
      isOnline: false,
    },
    {
      id: 'villa-torlonia',
      name: 'Villa Torlonia',
      image: 'assets/img/villa-torlonia.jpg',
      schedules: [
        { days: 'Mar · Gio', time: '7:00 — 8:00' },
      ],
      personalNote: true,
      isOnline: false,
    },
    {
      id: 'online',
      name: 'Online',
      image: 'assets/img/online.jpg',
      schedules: [],
      personalNote: true,
      isOnline: true,
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
      gsap.from('.locations-header', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.locations-section', start: 'top 75%' },
      });

      gsap.from('.location-card', {
        y: 50,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.locations-grid', start: 'top 80%' },
      });
    }, this.el.nativeElement);
  }

  toggleLocation(id: string): void {
    this.activeLocation.set(this.activeLocation() === id ? null : id);
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
