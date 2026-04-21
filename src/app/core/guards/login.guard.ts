import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { filter, map, take } from "rxjs";
import { AuthStore } from "../../features/auth/store/auth.store";
import { MessageService } from "primeng/api";
import { globalPaths } from "../../features/_config/global-paths.config";

export const loginGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const messageService = inject(MessageService);

  return toObservable(authStore.loading).pipe(
    filter(loading => !loading), // Aspetta che il caricamento sia completato
    take(1),
    map(() => {
      if (authStore.isAuthenticated()) {
        // Se la navigazione richiede un fragment (es. link "Programmi" dalla navbar),
        // lascia passare così l'utente loggato può tornare alle sezioni della landing.
        if (state.url.includes('#')) {
          return true;
        }
        return router.createUrlTree([globalPaths.dashboardUrl]);
      }

      // Utente non loggato, può accedere alla pagina di login
      return true;
    })
  );
};
