import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Observable, from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
  }

  // ─── AUTH ──────────────────────────────────────────────────────────────────

  signIn(email: string, password: string) {
    return from(
      this.client.auth.signInWithPassword({ email, password })
    );
  }

  signOut() {
    return from(this.client.auth.signOut());
  }

  getSession() {
    return from(this.client.auth.getSession());
  }

  // Listener reattivo ai cambiamenti di sessione (login/logout/token refresh)
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.client.auth.onAuthStateChange(callback);
  }

  // ─── PROFILO UTENTE ────────────────────────────────────────────────────────

  getProfile(userId: string): Observable<any> {
    return from(
      this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      })
    );
  }

  // ─── STORAGE ───────────────────────────────────────────────────────────────

  getStorageClient() {
    return this.client.storage;
  }

  // ─── REALTIME ──────────────────────────────────────────────────────────────

  // Ascolta cambiamenti in tempo reale su una tabella
  listenToTable(table: string, callback: (payload: any) => void) {
    return this.client
      .channel(`public:${table}`)
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table },
        callback
      )
      .subscribe();
  }
}
