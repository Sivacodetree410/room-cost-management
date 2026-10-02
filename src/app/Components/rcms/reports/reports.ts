import { Component, OnInit } from '@angular/core';
import { RoomCostService } from '../../../Services/room-cost.service';
import {
  OccupancyReportItem,
  MonthlyCostReportItem,
  MemberDueReportItem,
  VacatedMemberReportItem,
  Room,
} from '../../../models/room-cost.model';

@Component({
  selector: 'app-reports',
  standalone: false,
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class ReportsComponent implements OnInit {
  activeTab: 'occupancy' | 'cost' | 'due' | 'vacated' = 'occupancy';

  occupancyData: OccupancyReportItem[] = [];
  costData: MonthlyCostReportItem[] = [];
  dueData: MemberDueReportItem[] = [];
  vacatedData: VacatedMemberReportItem[] = [];

  rooms: Room[] = [];
  selectedRoom: string = 'ALL';
  selectedMonth: string = '2026-06';

  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';

  constructor(private rcmsService: RoomCostService) {}

  ngOnInit(): void {
    this.rcmsService.rooms$.subscribe((rooms) => {
      this.rooms = rooms;
      this.refreshAllReports();
    });

    this.rcmsService.members$.subscribe(() => {
      this.refreshAllReports();
    });

    this.rcmsService.expenses$.subscribe(() => {
      this.refreshAllReports();
    });

    this.rcmsService.payments$.subscribe(() => {
      this.refreshAllReports();
    });
  }

  refreshAllReports(): void {
    this.occupancyData = this.rcmsService.getOccupancyReport();
    this.costData = this.rcmsService.getMonthlyCostReport(this.selectedMonth);
    this.dueData = this.rcmsService.getMemberDueReport(
      this.selectedRoom !== 'ALL' ? this.selectedRoom : undefined,
      this.selectedMonth
    );
    this.vacatedData = this.rcmsService.getVacatedMembersReport();
  }

  onFilterChange(): void {
    this.refreshAllReports();
  }

  setTab(tab: 'occupancy' | 'cost' | 'due' | 'vacated'): void {
    this.activeTab = tab;
  }

  // Friendly WhatsApp Reminder text for bachelor flatmates
  sendDueReminder(item: MemberDueReportItem): void {
    const text = `Hi ${item.memberName}, reminder from Room 101 cost split for ${item.month}. Your pending share is ₹${item.due.toFixed(2)}. Please GPay/PhonePe to siva@oksbi when free. Thanks bro!`;
    navigator.clipboard?.writeText(text);
    this.showToast(`WhatsApp reminder text copied for ${item.memberName}!`, 'success');
  }

  // CSV Exporters
  exportOccupancyCsv(): void {
    const headers = ['Room No', 'Room Name', 'Cot Capacity', 'Active Roommates', 'Vacant Cots', 'Occupancy Rate %', 'Base Rent'];
    const rows = this.occupancyData.map((d) => [
      d.roomNo,
      d.roomName,
      d.maxCapacity,
      d.activeMembersCount,
      d.vacantSlots,
      d.occupancyRate + '%',
      d.baseRent,
    ]);
    this.rcmsService.exportToCsv('Bachelor_Room_Occupancy_Report', headers, rows);
    this.showToast('Occupancy report exported to CSV.', 'success');
  }

  exportCostCsv(): void {
    const headers = ['Room No', 'Room Name', 'Month', 'Rent', 'Electricity', 'Water', 'Internet', 'Cleaning', 'Other', 'Total Expense', 'Active Roommates', 'Avg Cost/Roommate'];
    const rows = this.costData.map((d) => [
      d.roomNo,
      d.roomName,
      d.month,
      d.rent,
      d.electricity,
      d.water,
      d.internet,
      d.cleaning,
      d.other,
      d.totalExpense,
      d.activeMembersCount,
      d.avgCostPerMember,
    ]);
    this.rcmsService.exportToCsv('Bachelor_Room_Monthly_Cost_Report', headers, rows);
    this.showToast('Monthly cost report exported to CSV.', 'success');
  }

  exportDueCsv(): void {
    const headers = ['Roommate Name', 'Room No', 'Month', 'Phone', 'Calculated Share', 'Paid', 'Due Amount', 'Status', 'Last Payment Date'];
    const rows = this.dueData.map((d) => [
      d.memberName,
      d.roomNo,
      d.month,
      d.phone,
      d.calculatedShare,
      d.paid,
      d.due,
      d.status,
      d.lastPaymentDate || 'None',
    ]);
    this.rcmsService.exportToCsv('Bachelor_Roommate_Due_Report', headers, rows);
    this.showToast('Roommate due report exported to CSV.', 'success');
  }

  exportVacatedCsv(): void {
    const headers = ['Roommate Name', 'Room No', 'Join Date', 'Leave Date', 'Stay Duration (Days)', 'Phone', 'Settlement Status', 'Pending Due'];
    const rows = this.vacatedData.map((d) => [
      d.memberName,
      d.roomNo,
      d.joinDate,
      d.leaveDate,
      d.totalStayDays,
      d.phone,
      d.settlementStatus,
      d.pendingDueAmount,
    ]);
    this.rcmsService.exportToCsv('Bachelor_Vacated_Roommates_Report', headers, rows);
    this.showToast('Vacated roommates report exported to CSV.', 'success');
  }

  getTotalCapacity(): number {
    return this.occupancyData.reduce((sum, d) => sum + d.maxCapacity, 0);
  }

  getTotalActiveOccupants(): number {
    return this.occupancyData.reduce((sum, d) => sum + d.activeMembersCount, 0);
  }

  getOverallOccupancyRate(): number {
    const total = this.getTotalCapacity();
    if (total === 0) return 0;
    return Math.round((this.getTotalActiveOccupants() / total) * 100);
  }

  getTotalCostExpense(): number {
    return this.costData.reduce((sum, d) => sum + d.totalExpense, 0);
  }

  getTotalOutstandingDues(): number {
    return this.dueData.reduce((sum, d) => sum + d.due, 0);
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }
}
