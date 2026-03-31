import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, from } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MessageService } from 'primeng/api';
import { SpinLoaderService } from '../../../core/services/spin-loader.service';
import { extractErrorMessage } from '../../../core/utils/extract-error-message.util';
import { loginSuccessPage, logoutSuccessPage } from './config/auth.config';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ProfileModel } from '../models/responses/profile.model';
import { LoginRequest } from '../models/requests/login.request';

type AuthState = {
  user: ProfileModel | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | undefined;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true, // true all'avvio: aspettiamo il check sessione
  error: undefined,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ user }) => ({
    userName: computed(() => {
      const u = user();
      return u ? `${u.nome} ${u.cognome}` : 'Ospite';
    }),
    email: computed(() => user()?.email ?? null),
    isAdmin: computed(() => user()?.ruolo === 'admin'),
    isAtleta: computed(() => user()?.ruolo === 'atleta'),
  })),

  withMethods((
    store,
    authService = inject(AuthService),
    router = inject(Router),
    messageService = inject(MessageService),
    loaderService = inject(SpinLoaderService),
    supabase = inject(SupabaseService),
  ) => ({

    // Svuota lo stato (usato da logout e onAuthStateChange)
    clearUser() {
      patchState(store, initialState);
      patchState(store, { loading: false }); // dopo clearUser loading deve essere false
    },

    // Salva il profilo utente nello stato
    setUser(user: ProfileModel) {
      patchState(store, {
        user,
        isAuthenticated: true,
        loading: false,
        error: undefined
      });
    },

    // Carica il profilo dalla tabella profiles dato uno userId
    loadProfile$: rxMethod<string>(
      pipe(
        tap(() => {
          patchState(store, { loading: true, error: undefined });
          loaderService.startSpinLoader();
        }),
        switchMap((userId) =>
          authService.getProfile(userId).pipe(
            tapResponse({
              next: (profile) => {
                if (!profile.attivo) {
                  // Utente registrato ma non ancora approvato dall'admin
                  supabase.client.auth.signOut(); // sign-out silenzioso
                  messageService.add({
                    severity: 'warn',
                    summary: 'Account non attivo',
                    detail: 'Il tuo profilo è in attesa di approvazione da parte dell\'amministratore.'
                  });
                  patchState(store, { user: null, isAuthenticated: false, loading: false, error: undefined });
                  loaderService.stopSpinLoader();
                  return;
                }
                patchState(store, {
                  user: profile,
                  isAuthenticated: true,
                  loading: false,
                  error: undefined
                });
                loaderService.stopSpinLoader();
              },
              error: (error: Error) => {
                // Profilo non trovato: utente auth ma senza profilo (non dovrebbe accadere)
                patchState(store, {
                  user: null,
                  isAuthenticated: false,
                  loading: false,
                  error: extractErrorMessage(error)
                });
                loaderService.stopSpinLoader();
              }
            })
          )
        )
      )
    ),

    // Controlla la sessione esistente all'avvio dell'app
    initAuth$: rxMethod<void>(
      pipe(
        switchMap(() =>
          from(authService.getSession()).pipe(
            tapResponse({
              next: ({ data: { session } }) => {
                if (session?.user) {
                  // Sessione attiva: carica il profilo
                  // loadProfile$ verrà chiamato subito dopo
                } else {
                  // Nessuna sessione: utente non loggato
                  patchState(store, {
                    user: null,
                    isAuthenticated: false,
                    loading: false,
                    error: undefined
                  });
                }
              },
              error: () => {
                patchState(store, { user: null, isAuthenticated: false, loading: false });
              }
            })
          )
        )
      )
    ),

    // Login con email e password
    login$: rxMethod<LoginRequest>(
      pipe(
        tap(() => {
          patchState(store, { loading: true, error: undefined });
          loaderService.startSpinLoader();
        }),
        switchMap((credentials) =>
          authService.login(credentials).pipe(
            tapResponse({
              next: ({ data, error }) => {
                if (error) {
                  messageService.add({
                    severity: 'error',
                    summary: 'Errore Login',
                    detail: error.message || 'Credenziali non valide'
                  });
                  patchState(store, {
                    loading: false,
                    isAuthenticated: false,
                    error: error.message
                  });
                  loaderService.stopSpinLoader();
                  return;
                }

                if (data?.user) {
                  // Login ok: carica profilo poi naviga
                  authService.getProfile(data.user.id).subscribe({
                    next: (profile) => {
                      if (!profile.attivo) {
                        supabase.client.auth.signOut();
                        messageService.add({
                          severity: 'warn',
                          summary: 'Account non attivo',
                          detail: 'Il tuo profilo è in attesa di approvazione da parte dell\'amministratore.'
                        });
                        patchState(store, { user: null, isAuthenticated: false, loading: false });
                        loaderService.stopSpinLoader();
                        return;
                      }
                      patchState(store, {
                        user: profile,
                        isAuthenticated: true,
                        loading: false,
                        error: undefined
                      });
                      loaderService.stopSpinLoader();
                      router.navigateByUrl(loginSuccessPage);
                    },
                    error: (err: Error) => {
                      messageService.add({
                        severity: 'error',
                        summary: 'Errore Profilo',
                        detail: 'Login riuscito ma profilo non trovato. Contatta l\'amministratore.'
                      });
                      patchState(store, { loading: false });
                      loaderService.stopSpinLoader();
                    }
                  });
                }
              },
              error: (error: Error) => {
                messageService.add({
                  severity: 'error',
                  summary: 'Errore Login',
                  detail: extractErrorMessage(error)
                });
                patchState(store, {
                  loading: false,
                  isAuthenticated: false,
                  error: extractErrorMessage(error)
                });
                loaderService.stopSpinLoader();
              }
            })
          )
        )
      )
    ),

    // Logout
    logout$: rxMethod<void>(
      pipe(
        tap(() => {
          patchState(store, { loading: true });
          loaderService.startSpinLoader();
        }),
        switchMap(() =>
          authService.logout().pipe(
            tapResponse({
              next: () => {
                patchState(store, {
                  user: null,
                  isAuthenticated: false,
                  loading: false,
                  error: undefined
                });
                loaderService.stopSpinLoader();
                router.navigateByUrl(logoutSuccessPage);
              },
              error: (error: Error) => {
                messageService.add({
                  severity: 'error',
                  summary: 'Errore Logout',
                  detail: extractErrorMessage(error)
                });
                patchState(store, { loading: false });
                loaderService.stopSpinLoader();
              }
            })
          )
        )
      )
    ),
  })),

  withHooks({
    onInit(store) {
      const supabase = inject(SupabaseService);

      // Controlla la sessione esistente all'avvio dell'app
      // e ascolta cambiamenti futuri (token refresh, logout da altra tab)
      supabase.onAuthStateChange((event, session) => {
        if (session?.user) {
          store.loadProfile$(session.user.id);
        } else {
          patchState(store, {
            user: null,
            isAuthenticated: false,
            loading: false
          });
        }
      });
    }
  })
);
