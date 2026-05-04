import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { environment } from '../../../environments/environment';
import { from, Observable } from 'rxjs';

export interface BookingPayload {
  nome:      string;
  cognome:   string;
  email:     string;
  messaggio: string;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly cfg = environment.emailjs;

  send(payload: BookingPayload): Observable<unknown> {
    return from(
      emailjs.send(
        this.cfg.serviceId,
        this.cfg.templateId,
        {
          from_name:     payload.nome,
          from_lastname: payload.cognome,
          from_email:    payload.email,
          message:       payload.messaggio,
          name:          payload.nome,          // From Name field
          email:         payload.email,         // Reply To field
        },
        { publicKey: this.cfg.publicKey },
      ),
    );
  }
}
