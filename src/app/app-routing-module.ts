import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'portal',
    loadChildren: () => import('./Components/rcms/rcms.module').then((m) => m.RcmsModule),
  },
  {
    path: 'auth',
    loadChildren: () => import('./Components/login-module').then((m) => m.LoginModule),
  },
  {
    path: 'RCMSLogin',
    loadChildren: () => import('./Components/login-module').then((m) => m.LoginModule),
  },
  {
    path: 'RCMSRegistrations',
    loadChildren: () => import('./Components/login-module').then((m) => m.LoginModule),
  },
  {
    path: '',
    redirectTo: 'portal',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'portal',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
