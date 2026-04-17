import { Routes } from "@angular/router";
import { loginGuard } from "../../core/guards/login.guard";
import { authGuard } from "../../core/guards/auth.guard";
import { adminGuard } from "../../core/guards/admin.guard";

export const layoutRoutes: Routes = [
  // Landing page: se già loggato → redirect a dashboard
  {
    path: '',
    canActivate: [loginGuard],
    loadComponent: () => import('../landing-page/landing-page').then(c => c.LandingPage)
  },
  // Sezione articoli pubblica
  {
    path: 'articoli',
    loadComponent: () => import('../articles/articles-public-page/articles-public-page').then(c => c.ArticlesPublicPage)
  },
  {
    path: 'articoli/:slug',
    loadComponent: () => import('../articles/article-detail-page/article-detail-page').then(c => c.ArticleDetailPage)
  },
  {
    path: 'app',
    children: [
      // Pagine senza layout app (no sidebar/header)
      {
        path: 'login',
        canActivate: [loginGuard],
        loadComponent: () => import('./../auth/login/login').then(c => c.Login)
      },
      {
        path: 'register',
        canActivate: [loginGuard],
        loadComponent: () => import('./../auth/register/register').then(c => c.Register)
      },
      // Area protetta — con layout app (Main = sidebar + header)
      {
        path: '',
        loadComponent: () => import('./main/main').then(c => c.Main),
        children: [
          {
            path: 'dashboard',
            canActivate: [authGuard],
            loadComponent: () => import('../dashboard/dashboard').then(c => c.Dashboard)
          },
          {
            path: 'groups',
            canActivate: [adminGuard],
            loadComponent: () => import('../groups/group-list/group-list').then(c => c.GroupList)
          },
          {
            path: 'athletes',
            canActivate: [adminGuard],
            loadComponent: () => import('../athletes/atleta-list/atleta-list').then(c => c.AtletaList)
          },
          {
            path: 'schede',
            canActivate: [adminGuard],
            loadComponent: () => import('../schedule/schedule-container/schedule-container').then(c => c.ScheduleContainer),
            children: [
              {
                path: ':atletaId',
                loadComponent: () => import('../schedule/athlete-schedule/athlete-schedule').then(c => c.AthleteSchedule),
              }
            ]
          },
          {
            // Rotta per l'atleta: vede solo la propria scheda
            path: 'la-mia-scheda',
            canActivate: [authGuard],
            loadComponent: () => import('../schedule/athlete-schedule/athlete-schedule').then(c => c.AthleteSchedule),
          },
          {
            path: 'notifications',
            canActivate: [authGuard],
            loadComponent: () => import('../notifications/notifications-page/notifications-page').then(c => c.NotificationsPage),
          },
          {
            path: 'payments',
            canActivate: [authGuard],
            loadComponent: () => import('../payments/payments-page/payments-page').then(c => c.PaymentsPage),
          },
          // Articoli (admin)
          {
            path: 'articoli',
            canActivate: [adminGuard],
            loadComponent: () => import('../articles/articles-admin-page/articles-admin-page').then(c => c.ArticlesAdminPage)
          },
          {
            path: 'articoli/nuovo',
            canActivate: [adminGuard],
            loadComponent: () => import('../articles/article-editor-page/article-editor-page').then(c => c.ArticleEditorPage)
          },
          {
            path: 'articoli/:id/modifica',
            canActivate: [adminGuard],
            loadComponent: () => import('../articles/article-editor-page/article-editor-page').then(c => c.ArticleEditorPage)
          },
          // Redirect /app → /app/dashboard
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          }
        ]
      }
    ]
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: ''
  },
];
