import { Component } from '@angular/core';

@Component({
  selector: 'app-social-strip',
  standalone: true,
  imports: [],
  templateUrl: './social-strip.html',
  styleUrl: './social-strip.scss',
})
export class SocialStrip {
  readonly socials = [
    {
      platform: 'Instagram',
      handle:   '@fulgaro_running',
      icon:     'pi pi-instagram',
      copy:     'Video di allenamento, consigli tecnici e behind the scenes dalle sessioni.',
      cta:      'Seguici',
      href:     'https://www.instagram.com/TUOPROFILO',
      accent:   '#ff8a95',
    },
    {
      platform: 'YouTube',
      handle:   'Fulgaro Corpo & Mente',
      icon:     'pi pi-youtube',
      copy:     'Tutorial di tecnica, race recap e contenuti esclusivi per migliorare la tua corsa.',
      cta:      'Iscriviti',
      href:     'https://www.youtube.com/@TUOCANALE',
      accent:   '#ff2b40',
    },
    {
      platform: 'Facebook',
      handle:   'Fulgaro Corpo e Mente',
      icon:     'pi pi-facebook',
      copy:     'Community di runner, eventi, gare e aggiornamenti dalla nostra squadra.',
      cta:      'Seguici',
      href:     'https://www.facebook.com/TUAPAGINA',
      accent:   '#ff8a95',
    },
  ];
}
