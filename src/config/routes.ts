import { AppLayout } from '../app/layout/component/app.layout';
import { Dashboard } from '../app/pages/dashboard/dashboard';
import { Notfound } from '../app/pages/notfound/notfound';
import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    component: AppLayout,
    children: [
      { path: '', component: Dashboard },
    ]
  },
  { path: "login", loadComponent: () => import("@/app/pages/auth/auth").then(c => c.Login)},
  { path: 'notfound', component: Notfound },
  { path: '**', redirectTo: '/notfound' }
];
