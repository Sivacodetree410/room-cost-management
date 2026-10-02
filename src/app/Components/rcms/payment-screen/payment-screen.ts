import { Component, OnInit } from '@angular/core';
import { RoomCostService } from '../../../Services/room-cost.service';
import { MemberPayment, Room, PaymentMode } from '../../../models/room-cost.model';

@Component({
  selector: 'app-payment-screen',
  standalone: false,
  templateUrl: './payment-screen.html',
  styleUrl: './payment-screen.css',
})
export class PaymentScreenComponent implements OnInit {
  payments: MemberPayment[] = [];
  filteredPayments: MemberPayment[] = [];
  rooms: Room[] = [];

  selectedRoomNo: string = 'ALL';
  selectedMonth: string = '2026-06';
  selectedStatus: string = 'ALL';
  searchTerm: string = '';

  // Modals
  isPaymentModalOpen = false;
  isReceiptModalOpen = false;
  isUpiModalOpen = false;
  selectedPayment: MemberPayment | null = null;

  // Record Payment Form
  paymentAmount: number = 0;
  paymentMode: PaymentMode = 'UPI';
  referenceNo: string = '';
  paymentNote: string = '';

  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';

  constructor(private rcmsService: RoomCostService) {}

  ngOnInit(): void {
    this.rcmsService.rooms$.subscribe((rooms) => {
      this.rooms = rooms;
    });

    this.rcmsService.payments$.subscribe((payments) => {
      this.payments = payments;
      this.applyFilter();
    });
  }

  applyFilter(): void {
    let list = this.rcmsService.getPayments(
      this.selectedRoomNo,
      this.selectedMonth,
      this.selectedStatus
    );

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.memberName.toLowerCase().includes(q) ||
          p.roomNo.toLowerCase().includes(q) ||
          p.month.toLowerCase().includes(q)
      );
    }

    this.filteredPayments = list;
  }

  openRecordModal(payment: MemberPayment): void {
    this.selectedPayment = payment;
    this.paymentAmount = payment.due > 0 ? payment.due : 0;
    this.paymentMode = 'UPI';
    this.referenceNo = 'UPI-' + Math.floor(100000000 + Math.random() * 900000000);
    this.paymentNote = 'Room rent & shared bills share';
    this.isPaymentModalOpen = true;
  }

  closeRecordModal(): void {
    this.isPaymentModalOpen = false;
    this.selectedPayment = null;
  }

  submitPayment(): void {
    if (!this.selectedPayment) return;
    if (this.paymentAmount <= 0) {
      this.showToast('Please enter an amount greater than ₹0.', 'error');
      return;
    }

    const res = this.rcmsService.recordPayment(
      this.selectedPayment.id,
      this.paymentAmount,
      this.paymentMode,
      this.referenceNo,
      this.paymentNote
    );

    if (res.success) {
      this.showToast(res.message, 'success');
      this.closeRecordModal();
    } else {
      this.showToast(res.message, 'error');
    }
  }

  markFull(payment: MemberPayment): void {
    if (confirm(`Mark ${payment.memberName}'s remaining due of ₹${payment.due.toFixed(2)} as fully settled?`)) {
      const res = this.rcmsService.markAsFullPaid(payment.id);
      if (res.success) {
        this.showToast(res.message, 'success');
      } else {
        this.showToast(res.message, 'error');
      }
    }
  }

  openReceiptModal(payment: MemberPayment): void {
    this.selectedPayment = payment;
    this.isReceiptModalOpen = true;
  }

  closeReceiptModal(): void {
    this.isReceiptModalOpen = false;
  }

  openUpiModal(payment: MemberPayment): void {
    this.selectedPayment = payment;
    this.isUpiModalOpen = true;
  }

  closeUpiModal(): void {
    this.isUpiModalOpen = false;
  }

  copyUpi(upiId?: string): void {
    if (!upiId) upiId = 'siva@oksbi';
    navigator.clipboard?.writeText(upiId);
    this.showToast(`UPI ID "${upiId}" copied to clipboard!`, 'success');
  }

  printReceipt(): void {
    window.print();
  }

  // Summary Metrics
  getTotalBilled(): number {
    return this.filteredPayments.reduce((sum, p) => sum + p.calculatedShare, 0);
  }

  getTotalCollected(): number {
    return this.filteredPayments.reduce((sum, p) => sum + p.paid, 0);
  }

  getTotalDue(): number {
    return this.filteredPayments.reduce((sum, p) => sum + p.due, 0);
  }

  getCollectionPercentage(): number {
    const total = this.getTotalBilled();
    if (total === 0) return 0;
    return Math.round((this.getTotalCollected() / total) * 100);
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }
}
