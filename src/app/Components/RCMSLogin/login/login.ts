import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  username: string = 'admin';
  password: string = 'admin123';

  constructor(private router: Router) {}

  ngOnInit(): void {}

  onLogin(): void {
    // Navigate directly into RCMS Portal
    this.router.navigate(['/portal']);
  }
}
