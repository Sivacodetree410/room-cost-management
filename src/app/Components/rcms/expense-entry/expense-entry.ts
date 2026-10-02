import { Component, OnInit } from '@angular/core';
import { RoomCostService } from '../../../Services/room-cost.service';
import { ExpenseItem, Room, ExpenseCategory } from '../../../models/room-cost.model';

@Component({
  selector: 'app-expense-entry',
  standalone: false,
  templateUrl: './expense-entry.html',
  styleUrl: './expense-entry.css',
})
export class ExpenseEntryComponent implements OnInit {
  expenses: ExpenseItem[] = [];
  filteredExpenses: ExpenseItem[] = [];
  rooms: Room[] = [];

  // Filter selections
  selectedRoomNo: string = 'Room 101';
  selectedMonth: string = '2026-06';
  categoryFilter: string = 'ALL';
  searchTerm: string = '';

  // Modals
  isModalOpen = false;
  isEditMode = false;

  // Form Model
  expenseForm: ExpenseItem = this.getEmptyExpenseForm();

  categories: { label: ExpenseCategory; title: string; icon: string; color: string }[] = [
    { label: 'Rent', title: 'Room Rent to Owner', icon: 'bi-house-door-fill', color: '#4f46e5' },
    { label: 'Electricity', title: 'EB Power Meter Bill', icon: 'bi-lightning-charge-fill', color: '#f59e0b' },
    { label: 'Water', title: 'Drinking Water 20L Cans', icon: 'bi-droplet-fill', color: '#06b6d4' },
    { label: 'Internet', title: 'Wi-Fi Broadband', icon: 'bi-wifi', color: '#8b5cf6' },
    { label: 'Cleaning', title: 'Maid Room Sweeping', icon: 'bi-stars', color: '#10b981' },
    { label: 'Other', title: 'Groceries / Room Items', icon: 'bi-cart-check-fill', color: '#64748b' },
  ];

  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';

  constructor(private rcmsService: RoomCostService) {}

  ngOnInit(): void {
    this.rcmsService.rooms$.subscribe((rooms) => {
      this.rooms = rooms;
      if (this.rooms.length > 0 && !this.selectedRoomNo) {
        this.selectedRoomNo = this.rooms[0].roomNo;
      }
    });

    this.rcmsService.expenses$.subscribe((expenses) => {
      this.expenses = expenses;
      this.applyFilter();
    });
  }

  private getEmptyExpenseForm(): ExpenseItem {
    return {
      id: '',
      roomNo: this.selectedRoomNo !== 'ALL' ? this.selectedRoomNo : (this.rooms[0]?.roomNo || 'Room 101'),
      month: this.selectedMonth,
      category: 'Rent',
      title: '',
      amount: 0,
      billDate: `${this.selectedMonth}-01`,
      paidBy: 'Room Pool',
      receiptNo: '',
      notes: '',
    };
  }

  applyFilter(): void {
    let list = this.rcmsService.getExpenses(this.selectedRoomNo, this.selectedMonth);

    if (this.categoryFilter !== 'ALL') {
      list = list.filter((e) => e.category === this.categoryFilter);
    }

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.paidBy.toLowerCase().includes(q) ||
          (e.receiptNo && e.receiptNo.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q))
      );
    }

    this.filteredExpenses = list;
  }

  onRoomChange(): void {
    this.applyFilter();
  }

  onMonthChange(): void {
    this.applyFilter();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.expenseForm = this.getEmptyExpenseForm();
    this.isModalOpen = true;
  }

  openEditModal(expense: ExpenseItem): void {
    this.isEditMode = true;
    this.expenseForm = JSON.parse(JSON.stringify(expense));
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveExpense(): void {
    if (!this.expenseForm.title.trim()) {
      this.showToast('Please enter an expense title.', 'error');
      return;
    }
    if (this.expenseForm.amount <= 0) {
      this.showToast('Please enter an amount greater than ₹0.', 'error');
      return;
    }

    if (this.isEditMode) {
      const ok = this.rcmsService.updateExpense(this.expenseForm);
      if (ok) {
        this.showToast(`Updated expense "${this.expenseForm.title}"!`, 'success');
        this.closeModal();
      } else {
        this.showToast('Failed to update expense.', 'error');
      }
    } else {
      this.rcmsService.addExpense(this.expenseForm);
      this.showToast(`Added expense ₹${this.expenseForm.amount} for ${this.expenseForm.roomNo}!`, 'success');
      this.closeModal();
    }
  }

  deleteExpense(expense: ExpenseItem): void {
    if (confirm(`Delete expense "${expense.title}" of ₹${expense.amount}?`)) {
      this.rcmsService.deleteExpense(expense.id);
      this.showToast(`Expense "${expense.title}" deleted.`, 'success');
    }
  }

  autoPopulateBaseRent(): void {
    if (this.selectedRoomNo === 'ALL') {
      this.showToast('Please pick a specific room to auto-load its owner rent.', 'error');
      return;
    }

    const res = this.rcmsService.autoPopulateBaseRentExpense(this.selectedRoomNo, this.selectedMonth);
    if (res.success) {
      this.showToast(res.message, 'success');
    } else {
      this.showToast(res.message, 'error');
    }
  }

  getTotalMonthlyExpense(): number {
    return this.filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }

  getCategoryTotal(cat: ExpenseCategory): number {
    return this.expenses
      .filter(
        (e) =>
          (this.selectedRoomNo === 'ALL' || e.roomNo.toLowerCase() === this.selectedRoomNo.toLowerCase()) &&
          e.month === this.selectedMonth &&
          e.category === cat
      )
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }

  getCategoryPercentage(cat: ExpenseCategory): number {
    const total = this.getTotalMonthlyExpense();
    if (total === 0) return 0;
    return Math.round((this.getCategoryTotal(cat) / total) * 100);
  }

  getCategoryMeta(cat: ExpenseCategory) {
    return this.categories.find((c) => c.label === cat) || this.categories[5];
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }
}
