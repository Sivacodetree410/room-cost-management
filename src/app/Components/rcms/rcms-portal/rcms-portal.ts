import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rcms-portal',
  standalone: false,
  templateUrl: './rcms-portal.html',
  styleUrl: './rcms-portal.css',
})
export class RcmsPortalComponent implements OnInit {
  isSidebarCollapsed = false;
  isDarkMode = false;
  currentYear = new Date().getFullYear();

  navItems = [
    { label: 'Bachelor Dashboard', icon: 'bi-grid-1x2-fill', route: '/portal/dashboard', exact: true },
    { label: '1. Room Master', icon: 'bi-door-open-fill', route: '/portal/rooms', badge: 'Room' },
    { label: '2. Roommates Allocation', icon: 'bi-people-fill', route: '/portal/allocations', badge: 'Boys' },
    { label: '3. Room Expenses', icon: 'bi-receipt-cutoff', route: '/portal/expenses', badge: 'Bills' },
    { label: '4. Dynamic Cost Split', icon: 'bi-pie-chart-fill', route: '/portal/split', badge: 'Prorated' },
    { label: '5. Roommate Payments', icon: 'bi-credit-card-2-front-fill', route: '/portal/payments', badge: 'UPI' },
    { label: '6. Reports & Dues', icon: 'bi-file-earmark-bar-graph-fill', route: '/portal/reports', badge: 'Settled' },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('rcms_theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('rcms_theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
      localStorage.setItem('rcms_theme', 'light');
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout(): void {
    this.router.navigate(['/RCMSLogin']);
  }
}
