import { Component, OnInit } from '@angular/core';
import { RoomCostService } from '../../../Services/room-cost.service';
import { Room, MonthSplitSummary, MemberSplitDetail } from '../../../models/room-cost.model';

@Component({
  selector: 'app-cost-split',
  standalone: false,
  templateUrl: './cost-split.html',
  styleUrl: './cost-split.css',
})
export class CostSplitComponent implements OnInit {
  rooms: Room[] = [];
  selectedRoomNo: string = 'R-101';
  selectedMonth: string = '2026-06';
  splitMode: 'prorated' | 'equal' = 'prorated';

  summary: MonthSplitSummary | null = null;

  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';

  constructor(private rcmsService: RoomCostService) {}

  ngOnInit(): void {
    this.rcmsService.rooms$.subscribe((rooms) => {
      this.rooms = rooms;
      if (this.rooms.length > 0 && !this.selectedRoomNo) {
        this.selectedRoomNo = this.rooms[0].roomNo;
      }
      this.recalculate();
    });

    this.rcmsService.expenses$.subscribe(() => {
      this.recalculate();
    });

    this.rcmsService.members$.subscribe(() => {
      this.recalculate();
    });
  }

  recalculate(): void {
    if (!this.selectedRoomNo || !this.selectedMonth) return;
    this.summary = this.rcmsService.calculateSplit(
      this.selectedRoomNo,
      this.selectedMonth,
      this.splitMode
    );
  }

  onRoomChange(): void {
    this.recalculate();
  }

  onMonthChange(): void {
    this.recalculate();
  }

  setSplitMode(mode: 'prorated' | 'equal'): void {
    this.splitMode = mode;
    this.recalculate();
  }

  syncToPayments(): void {
    if (!this.summary || this.summary.memberSplits.length === 0) {
      this.showToast('No active member splits to push for this room & month.', 'error');
      return;
    }

    const res = this.rcmsService.syncSplitToPayments(this.summary);
    this.showToast(res.message, 'success');
  }

  getDifference(split: MemberSplitDetail): number {
    return Math.round((split.calculatedShare - split.equalShare) * 100) / 100;
  }

  // Days visual representation array (1..totalDaysInMonth)
  getMonthDaysArray(): number[] {
    const totalDays = this.summary?.totalDaysInMonth || 30;
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  }

  isMemberPresentOnDay(member: MemberSplitDetail, day: number): boolean {
    if (!this.summary) return false;
    const [yearStr, monthStr] = this.summary.month.split('-');
    const curDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, day);

    const join = new Date(member.joinDate);
    const leave = member.leaveDate ? new Date(member.leaveDate) : null;

    if (curDate < join) return false;
    if (leave && curDate > leave) return false;
    return true;
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = null;
    }, 4000);
  }
}
