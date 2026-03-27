import { Component } from '@angular/core';

interface FooterLink {
  label: string;
  anchor: string;
}

interface FooterCol {
  heading: string;
  links: FooterLink[];
}

@Component({
  selector: 'app-landing-footer',
  imports: [],
  templateUrl: './landing-footer.html',
  styleUrl: './landing-footer.scss',
})
export class LandingFooter {
  protected readonly currentYear = new Date().getFullYear();

  protected readonly columns: FooterCol[] = [
    {
      heading: 'Programmi',
      links: [
        { label: 'Allenamento di Gruppo', anchor: '#programmi' },
        { label: 'Coaching Individuale 1:1', anchor: '#programmi' },
      ],
    },
    {
      heading: 'Sedi',
      links: [
        { label: 'Laghetto Tor di Quinto', anchor: '#dove-alleno' },
        { label: 'Sapienza Sport', anchor: '#dove-alleno' },
        { label: 'Villa Gordiani', anchor: '#dove-alleno' },
        { label: 'Villa Torlonia', anchor: '#dove-alleno' },
        { label: 'Online', anchor: '#dove-alleno' },
      ],
    },
    {
      heading: 'Contatti',
      links: [
        { label: 'Valutazione gratuita', anchor: '#cta' },
        { label: 'Filosofia', anchor: '#filosofia' },
        { label: 'Instagram', anchor: '#cta' },
      ],
    },
  ];

  protected readonly socials = [
    { icon: 'pi pi-instagram', label: 'Instagram' },
    { icon: 'pi pi-youtube', label: 'YouTube' },
    { icon: 'pi pi-facebook', label: 'Facebook' },
  ];

  scrollTo(anchor: string): void {
    document.querySelector(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
