import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-rcmsprelogin-layout',
  standalone: false,
  templateUrl: './rcmsprelogin-layout.html',
  styleUrl: './rcmsprelogin-layout.css',
})
export class RcmspreloginLayout implements OnInit {
  
  public currentYear !: number;

  ngOnInit(): void {
    this.currentYear = new Date().getFullYear();
  }

}
