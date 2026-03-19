import { AppLayout } from '../app/layout/component/app.layout';
import { Dashboard } from '../app/pages/dashboard/dashboard';
import { Notfound } from '../app/pages/notfound/notfound';
// import { Landing } from './app/pages/landing/landing';
import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    component: AppLayout,
    children: [
      { path: '', component: Dashboard },
      { path: 'pages', loadChildren: () => import('@/app/pages/pages.routes') }
    ]
  },
  // { path: 'landing', component: Landing },
  // { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
  { path: 'notfound', component: Notfound },
  { path: '**', redirectTo: '/notfound' }
];
