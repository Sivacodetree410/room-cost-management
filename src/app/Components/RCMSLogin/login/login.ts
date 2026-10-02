import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppRcmsServices } from '../../../Services/app-rcms-services';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  username: string = 'siva';
  password: string = 'siva123';
  isLoading = false;
  errorMessage = '';

  constructor(private router: Router, private apiService: AppRcmsServices) {}

  ngOnInit(): void {}

  onLogin(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Please enter both username and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Encrypted payload + JWT Token authentication via D:\Siva\RCMS
    this.apiService.login(this.username, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.Success) {
          this.router.navigate(['/portal/dashboard']);
        } else {
          this.errorMessage = res?.Message || 'Invalid credentials.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.Message || 'Login failed. Please check server connection.';
      },
    });
  }
}
