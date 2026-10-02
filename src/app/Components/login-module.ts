import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoginRoutingModule } from './login-routing-module';
import { Login } from './RCMSLogin/login/login';
import { RCMSLoginLayout } from '../Layouts/rcmslogin-layout/rcmslogin-layout';
import { Userregistrations } from './RCMSRegistrations/userregistrations/userregistrations';
import { RcmspreloginLayout } from '../Layouts/rcmsprelogin-layout/rcmsprelogin-layout';




@NgModule({
  declarations: [
    RCMSLoginLayout,
    RcmspreloginLayout,
    Login,
    Userregistrations
  ],
  imports: [
    FormsModule,
    CommonModule,
    LoginRoutingModule
   
  ]
})
export class LoginModule { }
