export type RoomStatus = 'Available' | 'Full' | 'Maintenance';
export type MemberStatus = 'Active' | 'Vacated';
export type ExpenseCategory = 'Rent' | 'Electricity' | 'Water' | 'Internet' | 'Cleaning' | 'Other';
export type PaymentStatus = 'Paid' | 'Partial' | 'Due' | 'Overdue';
export type PaymentMode = 'UPI' | 'Cash' | 'NetBanking' | 'Card';

export interface Room {
  roomNo: string; // e.g. "Room 101"
  roomName: string; // e.g. "Bachelors Haven", "Boys Den Flat 3B"
  maxCapacity: number; // e.g. 3 (number of cot/bed spaces)
  currentMembers: number; // dynamically computed active bachelor roommates
  baseRent: number; // monthly room rent paid to landlord
  status: RoomStatus;
  floor?: string;
  depositAmount?: number; // Advance / Security deposit
  amenities?: string[];
  notes?: string;
  createdAt: string;
}

export interface MemberAllocation {
  id: string;
  memberId: string;
  memberName: string; // e.g. Siva, Kumar, Rahul
  phone: string;
  email: string;
  roomNo: string;
  joinDate: string; // YYYY-MM-DD
  leaveDate: string | null; // YYYY-MM-DD or null if currently staying
  status: MemberStatus;
  collegeOrCompany?: string; // Where the bachelor boy works/studies
  hometown?: string; // Native place
  upiId?: string; // e.g. siva@oksbi, kumar@paytm
  emergencyContact?: string;
  depositPaid?: number; // Deposit amount paid by this roommate
  notes?: string;
}

export interface ExpenseItem {
  id: string;
  roomNo: string;
  month: string; // YYYY-MM e.g. "2026-06"
  category: ExpenseCategory;
  title: string; // e.g. "Room Rent to Owner", "EB Bill", "Drinking Water Cans"
  amount: number;
  billDate: string; // YYYY-MM-DD
  paidBy: string; // Who paid upfront (e.g. Siva, Room Pool, Kumar)
  receiptNo?: string;
  notes?: string;
}

export interface MemberSplitDetail {
  memberId: string;
  memberName: string;
  roomNo: string;
  joinDate: string;
  leaveDate: string | null;
  status: MemberStatus;
  daysOccupiedInMonth: number;
  totalMonthDays: number;
  occupancyRatio: number;
  calculatedShare: number;
  equalShare: number;
  formulaExplanation: string;
}

export interface MonthSplitSummary {
  roomNo: string;
  month: string; // YYYY-MM e.g. "2026-06"
  monthName: string;
  totalDaysInMonth: number;
  totalExpense: number;
  categoryTotals: Record<ExpenseCategory, number>;
  totalOccupiedDays: number;
  activeMembersCount: number;
  dayRate: number; // totalExpense / totalOccupiedDays
  memberSplits: MemberSplitDetail[];
  splitMode: 'prorated' | 'equal';
  lastCalculated: string;
}

export interface PaymentTransaction {
  id: string;
  date: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNo?: string;
  note?: string;
}

export interface MemberPayment {
  id: string;
  memberId: string;
  memberName: string;
  roomNo: string;
  month: string; // YYYY-MM
  calculatedShare: number;
  paid: number;
  due: number;
  status: PaymentStatus;
  dueDate: string;
  upiId?: string;
  transactions: PaymentTransaction[];
  updatedAt: string;
}

export interface OccupancyReportItem {
  roomNo: string;
  roomName: string;
  maxCapacity: number;
  activeMembersCount: number;
  vacantSlots: number;
  occupancyRate: number;
  baseRent: number;
  status: RoomStatus;
  currentResidents: {
    name: string;
    joinDate: string;
    phone: string;
    collegeOrCompany?: string;
  }[];
}

export interface MonthlyCostReportItem {
  roomNo: string;
  roomName: string;
  month: string;
  rent: number;
  electricity: number;
  water: number;
  internet: number;
  cleaning: number;
  other: number;
  totalExpense: number;
  activeMembersCount: number;
  avgCostPerMember: number;
}

export interface MemberDueReportItem {
  memberId: string;
  memberName: string;
  roomNo: string;
  month: string;
  phone: string;
  calculatedShare: number;
  paid: number;
  due: number;
  status: PaymentStatus;
  upiId?: string;
  lastPaymentDate?: string;
}

export interface VacatedMemberReportItem {
  memberId: string;
  memberName: string;
  roomNo: string;
  joinDate: string;
  leaveDate: string;
  totalStayDays: number;
  phone: string;
  email: string;
  settlementStatus: 'Settled' | 'Pending Dues';
  pendingDueAmount: number;
}
