import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RCMSLoginLayout } from '../Layouts/rcmslogin-layout/rcmslogin-layout';
import { Login } from './RCMSLogin/login/login';
import { RcmspreloginLayout } from '../Layouts/rcmsprelogin-layout/rcmsprelogin-layout';
import { Userregistrations } from './RCMSRegistrations/userregistrations/userregistrations';


const routes: Routes = [
  {
    path:'',
    component:RCMSLoginLayout,
    children:[
      {
        path:'',
        component:Login
      },
      {
        path:'RCMSLogin',
        component:Login
      }
    ]
  },
  {
    path:'RCMSRegistrations',
    component:RcmspreloginLayout,
    children:[
      {
        path:'',
        component:Userregistrations
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LoginRoutingModule { }
