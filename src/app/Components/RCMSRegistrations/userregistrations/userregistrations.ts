import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm } from '@angular/forms';
import { Userregistrationmodel } from '../Models/userregistrationmodel';
import { AppRcmsServices } from '../../../Services/app-rcms-services';


@Component({
  selector: 'app-userregistrations',
  standalone: false,
  templateUrl: './userregistrations.html',
  styleUrl: './userregistrations.css',
})

 

export class Userregistrations implements OnInit {

  registration:Userregistrationmodel={
    usernamereg:'',
    fullnamereg:'',
    emailreg:'',
    mobilenoreg:'',
    passwordreg:'',
    confirmpwdreg:''
  }

  @ViewChild('RCMSRegistrationsForm') RCMSRegistrationForm!: NgForm;

  constructor(private apiservices:AppRcmsServices){

  }

  ngOnInit(): void {

  }


  RegistrationsFormsubmit(){
    this.apiservices.postdataRequest('users', this.registration).subscribe({
      next: (response) => {
        console.log(response);
      },
      error: (error) => {
        console.error(error);
      }
    }); 
  }


}
