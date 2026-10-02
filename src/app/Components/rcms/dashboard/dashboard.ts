import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RoomCostService } from '../../../Services/room-cost.service';
import { Room, MemberAllocation, ExpenseItem, MemberPayment, MonthSplitSummary } from '../../../models/room-cost.model';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  rooms: Room[] = [];
  members: MemberAllocation[] = [];
  expenses: ExpenseItem[] = [];
  payments: MemberPayment[] = [];

  currentMonth: string = '2026-06';
  r101Split: MonthSplitSummary | null = null;

  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';

  constructor(private rcmsService: RoomCostService, private router: Router) {}

  ngOnInit(): void {
    this.rcmsService.rooms$.subscribe((r) => (this.rooms = r));
    this.rcmsService.members$.subscribe((m) => (this.members = m));
    this.rcmsService.expenses$.subscribe((e) => {
      this.expenses = e;
      this.refreshSplitHighlight();
    });
    this.rcmsService.payments$.subscribe((p) => (this.payments = p));
  }

  refreshSplitHighlight(): void {
    this.r101Split = this.rcmsService.calculateSplit('R-101', this.currentMonth, 'prorated');
  }

  navigateTo(path: string): void {
    this.router.navigate(['/portal', path]);
  }

  resetData(): void {
    if (confirm('Are you sure you want to reset all data back to the prompt sample state? (Room R-101 with Siva, Kumar, Rahul, ₹15,000 June expenses)')) {
      this.rcmsService.resetToSampleData();
      this.showToast('Data successfully reset to standard sample records!', 'success');
    }
  }

  // KPIs
  getTotalCapacity(): number {
    return this.rooms.reduce((sum, r) => sum + r.maxCapacity, 0);
  }

  getActiveMembersCount(): number {
    return this.members.filter((m) => m.status === 'Active').length;
  }

  getVacantBeds(): number {
    return Math.max(0, this.getTotalCapacity() - this.getActiveMembersCount());
  }

  getTotalCurrentMonthExpenses(): number {
    return this.expenses
      .filter((e) => e.month === this.currentMonth)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }

  getTotalPendingDues(): number {
    return this.payments.reduce((sum, p) => sum + p.due, 0);
  }

  getRecentExpenses(): ExpenseItem[] {
    return this.expenses.slice(-5).reverse();
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }
}
