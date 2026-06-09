import { Routes } from '@angular/router';
import { authGuardGuard } from './guards/auth-guard/auth-guard-guard';
import { noAuthGuard } from './guards/no-auth-guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [noAuthGuard],
    canActivateChild: [noAuthGuard],
    children: [
      {
        path: 'sign-in',
        loadComponent: () => import('./features/auth/sign-in/sign-in').then((m) => m.SignIn),
      },
    ],
  },

  {
    path: '',
    canActivate: [authGuardGuard],
    canActivateChild: [authGuardGuard],
    loadComponent: () => import('./features/tickets/tickets').then((m) => m.Tickets),
    children: [
      {
        path: 'ticket/:id',
        loadComponent: () => import('./features/tickets/ticket/ticket').then((m) => m.Ticket),
      },
      {
        path: 'ticket/:id/:tk',
        loadComponent: () => import('./features/tickets/ticket/ticket').then((m) => m.Ticket),
      },
    ],
  },
];
