import { inject, Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ProfileModel } from '../models/responses/profile.model';
import { LoginRequest } from '../models/requests/login.request';
import { RegisterRequest } from '../models/requests/register.request';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private supabase = inject(SupabaseService);

  // Registrazione atleta: crea utente Auth + il trigger crea automaticamente il profilo
  register(request: RegisterRequest) {
    return this.supabase.client.auth.signUp({
      email:    request.email,
      password: request.password,
      options:  { data: { nome: request.nome, cognome: request.cognome } }
    });
  }

  // Login con email e password tramite Supabase Auth
  login(request: LoginRequest) {
    return this.supabase.signIn(request.email, request.password);
  }

  // Logout tramite Supabase Auth
  logout() {
    return this.supabase.signOut();
  }

  // Recupera la sessione corrente (usato all'avvio app)
  getSession() {
    return this.supabase.getSession();
  }

  // Carica il profilo utente dalla tabella profiles
  getProfile(userId: string): Observable<ProfileModel> {
    return from(
      this.supabase.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    ).pipe(
      map(({ data, error }: { data: any; error: any }) => {
        if (error) throw error;
        return data as ProfileModel;
      })
    );
  }
}
