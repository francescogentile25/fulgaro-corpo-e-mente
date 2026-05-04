import {
  afterNextRender,
  Component,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface Program {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  idealFor: string;
}

@Component({
  selector: 'app-programs-section',
  imports: [],
  templateUrl: './programs-section.html',
  styleUrl: './programs-section.scss',
})
export class ProgramsSection implements OnDestroy {
  protected readonly programs: Program[] = [
    {
      id: 'gruppo',
      icon: 'pi pi-users',
      title: 'ALLENAMENTO DI GRUPPO',
      subtitle: 'Energia collettiva',
      description:
        'La forza del gruppo è il motore più potente che esista. Sessioni strutturate dove la competizione sana e il supporto reciproco ti portano oltre i tuoi limiti. Ogni allenamento è progettato per coinvolgere tutti i livelli: i principianti crescono trainati dal ritmo del gruppo, i più esperti affinano la gestione della gara in contesto reale.',
      highlights: [
        'Sessioni strutturate per tutti i livelli',
        'Dinamiche di gruppo che accelerano il miglioramento',
        'Lavori di soglia, ripetute e fondo in compagnia',
        'Feedback tecnico in tempo reale durante la sessione',
        'Comunità motivante che rende costante l\'allenamento',
      ],
      idealFor: 'Chi cerca motivazione costante, ama allenarsi in compagnia e vuole migliorare in un contesto stimolante e strutturato.',
    },
    {
      id: 'individuale',
      icon: 'pi pi-user',
      title: 'COACHING INDIVIDUALE 1:1',
      subtitle: 'Precisione assoluta',
      description:
        'Un percorso costruito esclusivamente attorno a te. Analisi biomeccanica, programmazione periodizzata e sessioni private dove ogni minuto è dedicato ai tuoi obiettivi specifici. Che tu stia preparando la tua prima 10K o puntando al personal best in maratona, il coaching individuale elimina ogni spreco e massimizza ogni singolo allenamento.',
      highlights: [
        'Piano completamente personalizzato sulle tue esigenze',
        'Analisi tecnica e biomeccanica individuale',
        'Programmazione periodizzata con obiettivi misurabili',
        'Flessibilità totale su orari e location',
        'Monitoraggio costante e aggiustamenti in tempo reale',
      ],
      idealFor: 'Chi ha obiettivi specifici, preferisce un\'attenzione dedicata o ha esigenze di orario e location particolari.',
    },
    {
      id: 'online',
      icon: 'pi pi-video',
      title: 'ALLENAMENTO ONLINE',
      subtitle: 'Ovunque tu sia',
      description:
        'La distanza non è un ostacolo. Il programma online porta il metodo Fulgaro direttamente dove vuoi tu: piani di allenamento su misura, analisi video della tecnica di corsa e check-in settimanali per monitorare i progressi. Stessa qualità del coaching in presenza, massima flessibilità di orari e location.',
      highlights: [
        'Piano personalizzato aggiornato ogni settimana',
        'Analisi video della tecnica tramite registrazioni inviate dal runner',
        'Check-in settimanali via messaggi e videocall',
        'Accesso a libreria di esercizi e routine di forza specifica',
        'Supporto continuo su canale dedicato 7 giorni su 7',
      ],
      idealFor: 'Chi vive fuori Roma, ha orari difficili o viaggia spesso e vuole comunque un percorso strutturato e seguito da un coach certificato.',
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
      gsap.from('.programs-header', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.programs-section', start: 'top 75%' },
      });

      gsap.from('.program-card', {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.programs-grid', start: 'top 80%' },
      });
    }, this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
