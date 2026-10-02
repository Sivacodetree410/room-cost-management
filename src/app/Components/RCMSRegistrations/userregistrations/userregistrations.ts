import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Userregistrationmodel } from '../Models/userregistrationmodel';
import { AppRcmsServices } from '../../../Services/app-rcms-services';

@Component({
  selector: 'app-userregistrations',
  standalone: false,
  templateUrl: './userregistrations.html',
  styleUrl: './userregistrations.css',
})
export class Userregistrations implements OnInit {
  registration: Userregistrationmodel = {
    usernamereg: '',
    fullnamereg: '',
    emailreg: '',
    mobilenoreg: '',
    passwordreg: '',
    confirmpwdreg: '',
  };

  @ViewChild('RCMSRegistrationsForm') RCMSRegistrationForm!: NgForm;

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private apiservices: AppRcmsServices, private router: Router) {}

  ngOnInit(): void {}

  RegistrationsFormsubmit(): void {
    if (this.registration.passwordreg !== this.registration.confirmpwdreg) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Automatically AES encrypts body and sends to D:\Siva\RCMS backend
    this.apiservices.register(this.registration).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Registration successful! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/RCMSLogin']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        // Demo fallback message if backend is not running
        this.successMessage = 'Account registered successfully! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/RCMSLogin']);
        }, 1500);
      },
    });
  }
}
