import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-rcmslogin-layout',
  standalone: false,
  templateUrl: './rcmslogin-layout.html',
  styleUrl: './rcmslogin-layout.css',
})
export class RCMSLoginLayout implements OnInit {

  public currentYear !: number;

  ngOnInit(): void {
    this.currentYear = new Date().getFullYear();
  }



}
