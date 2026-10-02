import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Room,
  MemberAllocation,
  ExpenseItem,
  MonthSplitSummary,
  MemberSplitDetail,
  MemberPayment,
  PaymentTransaction,
  ExpenseCategory,
  OccupancyReportItem,
  MonthlyCostReportItem,
  MemberDueReportItem,
  VacatedMemberReportItem,
} from '../models/room-cost.model';

@Injectable({
  providedIn: 'root',
})
export class RoomCostService {
  private readonly STORAGE_KEY_ROOMS = 'rcms_bachelor_rooms';
  private readonly STORAGE_KEY_MEMBERS = 'rcms_bachelor_members';
  private readonly STORAGE_KEY_EXPENSES = 'rcms_bachelor_expenses';
  private readonly STORAGE_KEY_PAYMENTS = 'rcms_bachelor_payments';

  // BehaviorSubjects for reactive state
  private roomsSubject = new BehaviorSubject<Room[]>([]);
  private membersSubject = new BehaviorSubject<MemberAllocation[]>([]);
  private expensesSubject = new BehaviorSubject<ExpenseItem[]>([]);
  private paymentsSubject = new BehaviorSubject<MemberPayment[]>([]);

  public rooms$: Observable<Room[]> = this.roomsSubject.asObservable();
  public members$: Observable<MemberAllocation[]> = this.membersSubject.asObservable();
  public expenses$: Observable<ExpenseItem[]> = this.expensesSubject.asObservable();
  public payments$: Observable<MemberPayment[]> = this.paymentsSubject.asObservable();

  constructor() {
    this.initializeData();
  }

  // ==========================================
  // INITIALIZATION & BACHELOR ROOM SEED DATA
  // ==========================================
  private initializeData(): void {
    const savedRooms = localStorage.getItem(this.STORAGE_KEY_ROOMS);
    const savedMembers = localStorage.getItem(this.STORAGE_KEY_MEMBERS);
    const savedExpenses = localStorage.getItem(this.STORAGE_KEY_EXPENSES);
    const savedPayments = localStorage.getItem(this.STORAGE_KEY_PAYMENTS);

    if (savedRooms && savedMembers && savedExpenses) {
      try {
        const rooms: Room[] = JSON.parse(savedRooms);
        const members: MemberAllocation[] = JSON.parse(savedMembers);
        const expenses: ExpenseItem[] = JSON.parse(savedExpenses);
        const payments: MemberPayment[] = savedPayments ? JSON.parse(savedPayments) : [];

        this.membersSubject.next(members);
        this.expensesSubject.next(expenses);
        this.paymentsSubject.next(payments);
        this.updateRoomOccupancyCounts(rooms, members);
        return;
      } catch (e) {
        console.error('Error loading stored bachelor data, reinitializing sample', e);
      }
    }

    this.resetToSampleData();
  }

  public resetToSampleData(): void {
    // Single room bachelor boys sharing setup
    const initialRooms: Room[] = [
      {
        roomNo: 'Room 101',
        roomName: 'Bachelors Haven (Boys Sharing)',
        maxCapacity: 3,
        currentMembers: 2,
        baseRent: 9000,
        depositAmount: 20000,
        status: 'Available',
        floor: '1st Floor',
        amenities: [
          'High-Speed Wi-Fi',
          'Drinking Water Dispenser',
          'Attached Bathroom',
          'Balcony with Clothesline',
          'Geyser',
          'Ceiling Fans & Study Tables',
        ],
        notes: 'Primary 3-sharing bachelor room with separate cots, wardrobes, and balcony.',
        createdAt: '2026-05-01',
      },
    ];

    // Seed Bachelor Roommates (Siva, Kumar, Rahul as specified in prompt)
    const initialMembers: MemberAllocation[] = [
      {
        id: 'mem-1',
        memberId: 'BR-101',
        memberName: 'Siva',
        phone: '+91 98765 43210',
        email: 'siva.tech@example.com',
        roomNo: 'Room 101',
        joinDate: '2026-06-01',
        leaveDate: null,
        status: 'Active',
        collegeOrCompany: 'Tech Solutions (Software Engineer)',
        hometown: 'Madurai',
        upiId: 'siva@oksbi',
        depositPaid: 7000,
        emergencyContact: '+91 98765 00001 (Father)',
        notes: 'Room coordinator, manages landlord rent & Wi-Fi bills',
      },
      {
        id: 'mem-2',
        memberId: 'BR-102',
        memberName: 'Kumar',
        phone: '+91 98765 43211',
        email: 'kumar.dev@example.com',
        roomNo: 'Room 101',
        joinDate: '2026-06-05',
        leaveDate: null,
        status: 'Active',
        collegeOrCompany: 'Cognizant (QA Engineer)',
        hometown: 'Trichy',
        upiId: 'kumar@paytm',
        depositPaid: 7000,
        emergencyContact: '+91 98765 00002 (Brother)',
        notes: 'Joined on 5th June after shifting from PG',
      },
      {
        id: 'mem-3',
        memberId: 'BR-103',
        memberName: 'Rahul',
        phone: '+91 98765 43212',
        email: 'rahul.intern@example.com',
        roomNo: 'Room 101',
        joinDate: '2026-06-10',
        leaveDate: '2026-06-20',
        status: 'Vacated',
        collegeOrCompany: 'Anna University (Final Year Intern)',
        hometown: 'Coimbatore',
        upiId: 'rahul@ybl',
        depositPaid: 6000,
        emergencyContact: '+91 98765 00003 (Father)',
        notes: 'Vacated on 20th June as summer internship completed',
      },
    ];

    // Seed Monthly Bachelor Room Expenses matching ₹15,000 prompt
    const initialExpenses: ExpenseItem[] = [
      {
        id: 'exp-1',
        roomNo: 'Room 101',
        month: '2026-06',
        category: 'Rent',
        title: 'Monthly Room Rent to Landlord',
        amount: 9000,
        billDate: '2026-06-01',
        paidBy: 'Room Pool',
        receiptNo: 'RENT-JUN-2026',
        notes: 'Fixed monthly room lease rent to house owner',
      },
      {
        id: 'exp-2',
        roomNo: 'Room 101',
        month: '2026-06',
        category: 'Electricity',
        title: 'EB Power Meter Bill',
        amount: 2400,
        billDate: '2026-06-12',
        paidBy: 'Siva',
        receiptNo: 'EB-2026-618',
        notes: 'Electricity bill for fans, geyser, laptop chargers',
      },
      {
        id: 'exp-3',
        roomNo: 'Room 101',
        month: '2026-06',
        category: 'Water',
        title: 'Drinking Water 20L Bubble Cans',
        amount: 600,
        billDate: '2026-06-05',
        paidBy: 'Kumar',
        receiptNo: 'WTR-CAN-12',
        notes: '12 drinking bubble cans @ ₹50 per can',
      },
      {
        id: 'exp-4',
        roomNo: 'Room 101',
        month: '2026-06',
        category: 'Internet',
        title: 'Airtel Fiber 200Mbps Wi-Fi Broadband',
        amount: 1200,
        billDate: '2026-06-08',
        paidBy: 'Siva',
        receiptNo: 'AIRTEL-FIBER-491',
        notes: 'Unlimited broadband shared among roommates',
      },
      {
        id: 'exp-5',
        roomNo: 'Room 101',
        month: '2026-06',
        category: 'Cleaning',
        title: 'Maid Room Sweeping & Mopping',
        amount: 1000,
        billDate: '2026-06-15',
        paidBy: 'Room Pool',
        receiptNo: 'MAID-06',
        notes: 'Bi-weekly room floor cleaning and bathroom wash',
      },
      {
        id: 'exp-6',
        roomNo: 'Room 101',
        month: '2026-06',
        category: 'Other',
        title: 'Groceries, Dishwash, Liquidator & Freshener',
        amount: 800,
        billDate: '2026-06-18',
        paidBy: 'Kumar',
        receiptNo: 'ROOM-ITEMS-88',
        notes: 'Vim bar, AllOut refills, room spray, dustbin covers',
      },
    ];

    // Seed Roommate Payments for June 2026
    const initialPayments: MemberPayment[] = [
      {
        id: 'pay-1',
        memberId: 'mem-1',
        memberName: 'Siva',
        roomNo: 'Room 101',
        month: '2026-06',
        calculatedShare: 6716.42,
        paid: 6716.42,
        due: 0,
        status: 'Paid',
        dueDate: '2026-06-25',
        upiId: 'siva@oksbi',
        transactions: [
          {
            id: 'txn-1',
            date: '2026-06-21',
            amount: 6716.42,
            paymentMode: 'UPI',
            referenceNo: 'UPI/617283948/GPay',
            note: 'Paid June share in full via Google Pay',
          },
        ],
        updatedAt: '2026-06-21T10:30:00Z',
      },
      {
        id: 'pay-2',
        memberId: 'mem-2',
        memberName: 'Kumar',
        roomNo: 'Room 101',
        month: '2026-06',
        calculatedShare: 5820.9,
        paid: 4000.0,
        due: 1820.9,
        status: 'Partial',
        dueDate: '2026-06-25',
        upiId: 'kumar@paytm',
        transactions: [
          {
            id: 'txn-2',
            date: '2026-06-22',
            amount: 4000.0,
            paymentMode: 'UPI',
            referenceNo: 'UPI/981273912/PhonePe',
            note: 'Part payment via PhonePe, balance ₹1820 pending',
          },
        ],
        updatedAt: '2026-06-22T14:15:00Z',
      },
      {
        id: 'pay-3',
        memberId: 'mem-3',
        memberName: 'Rahul',
        roomNo: 'Room 101',
        month: '2026-06',
        calculatedShare: 2462.68,
        paid: 0.0,
        due: 2462.68,
        status: 'Due',
        dueDate: '2026-06-20',
        upiId: 'rahul@ybl',
        transactions: [],
        updatedAt: '2026-06-20T18:00:00Z',
      },
    ];

    this.membersSubject.next(initialMembers);
    this.expensesSubject.next(initialExpenses);
    this.paymentsSubject.next(initialPayments);

    this.updateRoomOccupancyCounts(initialRooms, initialMembers);
    this.saveAll();
  }

  private saveAll(): void {
    localStorage.setItem(this.STORAGE_KEY_ROOMS, JSON.stringify(this.roomsSubject.value));
    localStorage.setItem(this.STORAGE_KEY_MEMBERS, JSON.stringify(this.membersSubject.value));
    localStorage.setItem(this.STORAGE_KEY_EXPENSES, JSON.stringify(this.expensesSubject.value));
    localStorage.setItem(this.STORAGE_KEY_PAYMENTS, JSON.stringify(this.paymentsSubject.value));
  }

  // ==========================================
  // 1. BACHELOR ROOM MASTER OPERATIONS
  // ==========================================
  public getRooms(): Room[] {
    return this.roomsSubject.value;
  }

  public getRoomByNo(roomNo: string): Room | undefined {
    return this.roomsSubject.value.find((r) => r.roomNo.toLowerCase() === roomNo.toLowerCase());
  }

  public addRoom(room: Room): boolean {
    const rooms = [...this.roomsSubject.value];
    if (rooms.some((r) => r.roomNo.toLowerCase() === room.roomNo.toLowerCase())) {
      return false;
    }
    room.currentMembers = 0;
    room.status = room.status || 'Available';
    room.createdAt = room.createdAt || new Date().toISOString().split('T')[0];
    rooms.push(room);
    this.roomsSubject.next(rooms);
    this.saveAll();
    return true;
  }

  public updateRoom(room: Room): boolean {
    const rooms = [...this.roomsSubject.value];
    const index = rooms.findIndex((r) => r.roomNo.toLowerCase() === room.roomNo.toLowerCase());
    if (index === -1) return false;

    const currentMembers = this.getActiveMembersForRoom(room.roomNo).length;
    room.currentMembers = currentMembers;
    if (currentMembers >= room.maxCapacity && room.status !== 'Maintenance') {
      room.status = 'Full';
    } else if (currentMembers < room.maxCapacity && room.status === 'Full') {
      room.status = 'Available';
    }

    rooms[index] = { ...rooms[index], ...room };
    this.roomsSubject.next(rooms);
    this.saveAll();
    return true;
  }

  public deleteRoom(roomNo: string): { success: boolean; message: string } {
    const activeMembers = this.getActiveMembersForRoom(roomNo);
    if (activeMembers.length > 0) {
      return {
        success: false,
        message: `Cannot delete ${roomNo}. There are ${activeMembers.length} active roommate(s) staying in it.`,
      };
    }
    const rooms = this.roomsSubject.value.filter(
      (r) => r.roomNo.toLowerCase() !== roomNo.toLowerCase()
    );
    this.roomsSubject.next(rooms);
    this.saveAll();
    return { success: true, message: `${roomNo} deleted successfully.` };
  }

  private updateRoomOccupancyCounts(rooms: Room[], members: MemberAllocation[]): void {
    const updated = rooms.map((room) => {
      const activeCount = members.filter(
        (m) => m.roomNo.toLowerCase() === room.roomNo.toLowerCase() && m.status === 'Active'
      ).length;

      let status = room.status;
      if (room.status !== 'Maintenance') {
        status = activeCount >= room.maxCapacity ? 'Full' : 'Available';
      }

      return {
        ...room,
        currentMembers: activeCount,
        status,
      };
    });
    this.roomsSubject.next(updated);
  }

  // ==========================================
  // 2. BACHELOR ROOMMATE ALLOCATION OPERATIONS
  // ==========================================
  public getAllMembers(): MemberAllocation[] {
    return this.membersSubject.value;
  }

  public getActiveMembersForRoom(roomNo: string): MemberAllocation[] {
    return this.membersSubject.value.filter(
      (m) => m.roomNo.toLowerCase() === roomNo.toLowerCase() && m.status === 'Active'
    );
  }

  public allocateMember(member: Omit<MemberAllocation, 'id'>): {
    success: boolean;
    message: string;
    member?: MemberAllocation;
  } {
    const room = this.getRoomByNo(member.roomNo);
    if (!room) {
      return { success: false, message: `Room ${member.roomNo} does not exist.` };
    }

    const currentActive = this.getActiveMembersForRoom(member.roomNo);
    if (currentActive.length >= room.maxCapacity) {
      return {
        success: false,
        message: `${member.roomNo} is already at full capacity (${room.maxCapacity}/${room.maxCapacity} cots occupied).`,
      };
    }

    const newMember: MemberAllocation = {
      ...member,
      id: 'mem-' + Date.now(),
      memberId: member.memberId || 'BR-' + (this.membersSubject.value.length + 101),
      status: 'Active',
      leaveDate: null,
    };

    const members = [...this.membersSubject.value, newMember];
    this.membersSubject.next(members);
    this.updateRoomOccupancyCounts(this.roomsSubject.value, members);
    this.saveAll();

    return {
      success: true,
      message: `Roommate ${newMember.memberName} successfully allocated cot in ${newMember.roomNo}!`,
      member: newMember,
    };
  }

  public updateMember(member: MemberAllocation): boolean {
    const members = [...this.membersSubject.value];
    const index = members.findIndex((m) => m.id === member.id);
    if (index === -1) return false;

    members[index] = member;
    this.membersSubject.next(members);
    this.updateRoomOccupancyCounts(this.roomsSubject.value, members);
    this.saveAll();
    return true;
  }

  public vacateMember(
    memberId: string,
    leaveDate: string
  ): { success: boolean; message: string } {
    const members = [...this.membersSubject.value];
    const index = members.findIndex((m) => m.id === memberId || m.memberId === memberId);
    if (index === -1) {
      return { success: false, message: 'Roommate record not found.' };
    }

    const member = members[index];
    if (member.joinDate && new Date(leaveDate) < new Date(member.joinDate)) {
      return {
        success: false,
        message: 'Leave date cannot be earlier than joining date (' + member.joinDate + ').',
      };
    }

    member.status = 'Vacated';
    member.leaveDate = leaveDate;
    members[index] = member;

    this.membersSubject.next(members);
    this.updateRoomOccupancyCounts(this.roomsSubject.value, members);
    this.saveAll();

    return {
      success: true,
      message: `Roommate ${member.memberName} marked as Vacated on ${leaveDate}. Bed/cot space is now free for new flatmate.`,
    };
  }

  public deleteMemberAllocation(id: string): boolean {
    const members = this.membersSubject.value.filter((m) => m.id !== id && m.memberId !== id);
    this.membersSubject.next(members);
    this.updateRoomOccupancyCounts(this.roomsSubject.value, members);
    this.saveAll();
    return true;
  }

  // ==========================================
  // 3. BACHELOR ROOM EXPENSE OPERATIONS
  // ==========================================
  public getExpenses(roomNo?: string, month?: string): ExpenseItem[] {
    let list = this.expensesSubject.value;
    if (roomNo && roomNo !== 'ALL') {
      list = list.filter((e) => e.roomNo.toLowerCase() === roomNo.toLowerCase());
    }
    if (month && month !== 'ALL') {
      list = list.filter((e) => e.month === month);
    }
    return list;
  }

  public addExpense(expense: Omit<ExpenseItem, 'id'>): ExpenseItem {
    const newExpense: ExpenseItem = {
      ...expense,
      id: 'exp-' + Date.now(),
    };
    const expenses = [...this.expensesSubject.value, newExpense];
    this.expensesSubject.next(expenses);
    this.saveAll();
    return newExpense;
  }

  public updateExpense(expense: ExpenseItem): boolean {
    const expenses = [...this.expensesSubject.value];
    const index = expenses.findIndex((e) => e.id === expense.id);
    if (index === -1) return false;

    expenses[index] = expense;
    this.expensesSubject.next(expenses);
    this.saveAll();
    return true;
  }

  public deleteExpense(id: string): boolean {
    const expenses = this.expensesSubject.value.filter((e) => e.id !== id);
    this.expensesSubject.next(expenses);
    this.saveAll();
    return true;
  }

  public autoPopulateBaseRentExpense(
    roomNo: string,
    month: string
  ): { success: boolean; message: string; expense?: ExpenseItem } {
    const room = this.getRoomByNo(roomNo);
    if (!room) return { success: false, message: 'Room not found.' };

    const existingRent = this.expensesSubject.value.find(
      (e) =>
        e.roomNo.toLowerCase() === roomNo.toLowerCase() &&
        e.month === month &&
        e.category === 'Rent'
    );
    if (existingRent) {
      return {
        success: false,
        message: `Owner room rent of ₹${existingRent.amount} is already logged for ${roomNo} in ${month}.`,
      };
    }

    const newExpense = this.addExpense({
      roomNo: room.roomNo,
      month,
      category: 'Rent',
      title: `Monthly Room Rent to Landlord`,
      amount: room.baseRent,
      billDate: `${month}-01`,
      paidBy: 'Room Pool',
      notes: 'Monthly fixed rent to flat owner',
    });

    return {
      success: true,
      message: `Added ₹${room.baseRent} room rent for ${roomNo} (${month}).`,
      expense: newExpense,
    };
  }

  // ==========================================
  // 4. DYNAMIC BACHELOR COST SPLIT ENGINE
  // ==========================================
  public calculateSplit(
    roomNo: string,
    month: string,
    splitMode: 'prorated' | 'equal' = 'prorated'
  ): MonthSplitSummary {
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);

    const totalDaysInMonth = new Date(year, monthNum, 0).getDate();
    const monthStartDate = new Date(year, monthNum - 1, 1);
    const monthEndDate = new Date(year, monthNum - 1, totalDaysInMonth);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthName = `${monthNames[monthNum - 1]} ${year}`;

    const roomExpenses = this.expensesSubject.value.filter(
      (e) => e.roomNo.toLowerCase() === roomNo.toLowerCase() && e.month === month
    );

    const totalExpense = roomExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const categoryTotals: Record<ExpenseCategory, number> = {
      Rent: 0,
      Electricity: 0,
      Water: 0,
      Internet: 0,
      Cleaning: 0,
      Other: 0,
    };

    roomExpenses.forEach((e) => {
      if (categoryTotals[e.category] !== undefined) {
        categoryTotals[e.category] += Number(e.amount || 0);
      }
    });

    const allRoomMembers = this.membersSubject.value.filter(
      (m) => m.roomNo.toLowerCase() === roomNo.toLowerCase()
    );

    const eligibleMembers: {
      member: MemberAllocation;
      occupiedDays: number;
    }[] = [];

    allRoomMembers.forEach((m) => {
      const join = new Date(m.joinDate);
      const leave = m.leaveDate ? new Date(m.leaveDate) : null;

      if (join > monthEndDate) return;
      if (leave && leave < monthStartDate) return;

      const effectiveStart = join < monthStartDate ? monthStartDate : join;
      const effectiveEnd = !leave || leave > monthEndDate ? monthEndDate : leave;

      const diffTime = effectiveEnd.getTime() - effectiveStart.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const occupiedDays = Math.max(0, diffDays);

      if (occupiedDays > 0) {
        eligibleMembers.push({ member: m, occupiedDays });
      }
    });

    const totalOccupiedDays = eligibleMembers.reduce((sum, item) => sum + item.occupiedDays, 0);
    const activeMembersCount = eligibleMembers.length;

    const dayRate = totalOccupiedDays > 0 ? totalExpense / totalOccupiedDays : 0;
    const equalShareAmount =
      activeMembersCount > 0 ? Math.round((totalExpense / activeMembersCount) * 100) / 100 : 0;

    const memberSplits: MemberSplitDetail[] = eligibleMembers.map((item) => {
      const { member, occupiedDays } = item;
      const occupancyRatio = totalOccupiedDays > 0 ? occupiedDays / totalOccupiedDays : 0;

      let calculatedShare = 0;
      let formulaExplanation = '';

      if (splitMode === 'prorated') {
        calculatedShare = Math.round(totalExpense * occupancyRatio * 100) / 100;
        formulaExplanation = `(₹${totalExpense.toLocaleString()} / ${totalOccupiedDays} days) × ${occupiedDays} days = ₹${calculatedShare.toFixed(2)}`;
      } else {
        calculatedShare = equalShareAmount;
        formulaExplanation = `₹${totalExpense.toLocaleString()} / ${activeMembersCount} roommates = ₹${equalShareAmount.toFixed(2)}`;
      }

      return {
        memberId: member.id,
        memberName: member.memberName,
        roomNo: member.roomNo,
        joinDate: member.joinDate,
        leaveDate: member.leaveDate,
        status: member.status,
        daysOccupiedInMonth: occupiedDays,
        totalMonthDays: totalDaysInMonth,
        occupancyRatio,
        calculatedShare,
        equalShare: equalShareAmount,
        formulaExplanation,
      };
    });

    return {
      roomNo,
      month,
      monthName,
      totalDaysInMonth,
      totalExpense,
      categoryTotals,
      totalOccupiedDays,
      activeMembersCount,
      dayRate,
      memberSplits,
      splitMode,
      lastCalculated: new Date().toISOString(),
    };
  }

  public syncSplitToPayments(
    summary: MonthSplitSummary
  ): { created: number; updated: number; message: string } {
    const payments = [...this.paymentsSubject.value];
    let created = 0;
    let updated = 0;

    summary.memberSplits.forEach((split) => {
      const memberObj = this.membersSubject.value.find((m) => m.id === split.memberId);
      const existingIndex = payments.findIndex(
        (p) =>
          p.roomNo.toLowerCase() === summary.roomNo.toLowerCase() &&
          p.month === summary.month &&
          (p.memberId === split.memberId || p.memberName.toLowerCase() === split.memberName.toLowerCase())
      );

      const targetShare = split.calculatedShare;

      if (existingIndex > -1) {
        const existing = payments[existingIndex];
        const due = Math.max(0, Math.round((targetShare - existing.paid) * 100) / 100);
        let status = existing.status;
        if (existing.paid >= targetShare) {
          status = 'Paid';
        } else if (existing.paid > 0) {
          status = 'Partial';
        } else {
          status = 'Due';
        }

        payments[existingIndex] = {
          ...existing,
          calculatedShare: targetShare,
          due,
          status,
          upiId: memberObj?.upiId || existing.upiId,
          updatedAt: new Date().toISOString(),
        };
        updated++;
      } else {
        const newPayment: MemberPayment = {
          id: 'pay-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          memberId: split.memberId,
          memberName: split.memberName,
          roomNo: summary.roomNo,
          month: summary.month,
          calculatedShare: targetShare,
          paid: 0,
          due: targetShare,
          status: 'Due',
          dueDate: `${summary.month}-25`,
          upiId: memberObj?.upiId,
          transactions: [],
          updatedAt: new Date().toISOString(),
        };
        payments.push(newPayment);
        created++;
      }
    });

    this.paymentsSubject.next(payments);
    this.saveAll();

    return {
      created,
      updated,
      message: `Pushed ${created + updated} roommate cost split record(s) to Payment Screen for ${summary.monthName}!`,
    };
  }

  // ==========================================
  // 5. ROOMMATE PAYMENT SCREEN OPERATIONS
  // ==========================================
  public getPayments(roomNo?: string, month?: string, status?: string): MemberPayment[] {
    let list = this.paymentsSubject.value;
    if (roomNo && roomNo !== 'ALL') {
      list = list.filter((p) => p.roomNo.toLowerCase() === roomNo.toLowerCase());
    }
    if (month && month !== 'ALL') {
      list = list.filter((p) => p.month === month);
    }
    if (status && status !== 'ALL') {
      list = list.filter((p) => p.status === status);
    }
    return list;
  }

  public recordPayment(
    paymentId: string,
    amountPaid: number,
    mode: PaymentTransaction['paymentMode'],
    referenceNo?: string,
    note?: string
  ): { success: boolean; message: string; payment?: MemberPayment } {
    const payments = [...this.paymentsSubject.value];
    const index = payments.findIndex((p) => p.id === paymentId);
    if (index === -1) {
      return { success: false, message: 'Payment record not found.' };
    }

    const payment = payments[index];
    const amount = Number(amountPaid);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, message: 'Please enter a valid amount.' };
    }

    const newTxn: PaymentTransaction = {
      id: 'txn-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      amount,
      paymentMode: mode,
      referenceNo: referenceNo || `UPI-${Date.now().toString().slice(-6)}`,
      note: note || 'Room rent & bills payment',
    };

    const newPaid = Math.round((payment.paid + amount) * 100) / 100;
    const newDue = Math.max(0, Math.round((payment.calculatedShare - newPaid) * 100) / 100);

    let newStatus: MemberPayment['status'] = 'Partial';
    if (newPaid >= payment.calculatedShare) {
      newStatus = 'Paid';
    } else if (newPaid > 0) {
      newStatus = 'Partial';
    } else {
      newStatus = 'Due';
    }

    payment.paid = newPaid;
    payment.due = newDue;
    payment.status = newStatus;
    payment.transactions = [...payment.transactions, newTxn];
    payment.updatedAt = new Date().toISOString();

    payments[index] = payment;
    this.paymentsSubject.next(payments);
    this.saveAll();

    return {
      success: true,
      message: `Recorded ₹${amount.toLocaleString()} from ${payment.memberName}. Remaining due: ₹${newDue.toLocaleString()}.`,
      payment,
    };
  }

  public markAsFullPaid(paymentId: string): { success: boolean; message: string } {
    const payments = [...this.paymentsSubject.value];
    const index = payments.findIndex((p) => p.id === paymentId);
    if (index === -1) return { success: false, message: 'Payment record not found.' };

    const payment = payments[index];
    const remaining = payment.due;
    if (remaining <= 0) {
      return { success: false, message: 'This roommate has already cleared all room dues.' };
    }

    return this.recordPayment(
      paymentId,
      remaining,
      'UPI',
      'UPI-SETTLE-' + Date.now().toString().slice(-4),
      'Roommate cleared full share'
    );
  }

  // ==========================================
  // 6. REPORTS OPERATIONS
  // ==========================================
  public getOccupancyReport(): OccupancyReportItem[] {
    const rooms = this.roomsSubject.value;
    const members = this.membersSubject.value;

    return rooms.map((room) => {
      const activeResidents = members.filter(
        (m) => m.roomNo.toLowerCase() === room.roomNo.toLowerCase() && m.status === 'Active'
      );
      const activeCount = activeResidents.length;
      const vacantSlots = Math.max(0, room.maxCapacity - activeCount);
      const occupancyRate =
        room.maxCapacity > 0 ? Math.round((activeCount / room.maxCapacity) * 100) : 0;

      return {
        roomNo: room.roomNo,
        roomName: room.roomName,
        maxCapacity: room.maxCapacity,
        activeMembersCount: activeCount,
        vacantSlots,
        occupancyRate,
        baseRent: room.baseRent,
        status: room.status,
        currentResidents: activeResidents.map((r) => ({
          name: r.memberName,
          joinDate: r.joinDate,
          phone: r.phone,
          collegeOrCompany: r.collegeOrCompany,
        })),
      };
    });
  }

  public getMonthlyCostReport(selectedMonth?: string): MonthlyCostReportItem[] {
    const rooms = this.roomsSubject.value;
    const allExpenses = this.expensesSubject.value;
    const allMembers = this.membersSubject.value;

    const report: MonthlyCostReportItem[] = [];

    rooms.forEach((room) => {
      const months = selectedMonth
        ? [selectedMonth]
        : Array.from(
            new Set(
              allExpenses
                .filter((e) => e.roomNo.toLowerCase() === room.roomNo.toLowerCase())
                .map((e) => e.month)
            )
          );

      if (months.length === 0 && selectedMonth) {
        months.push(selectedMonth);
      }

      months.forEach((month) => {
        const roomMonthExpenses = allExpenses.filter(
          (e) => e.roomNo.toLowerCase() === room.roomNo.toLowerCase() && e.month === month
        );

        const getCategoryAmount = (cat: ExpenseCategory) =>
          roomMonthExpenses
            .filter((e) => e.category === cat)
            .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        const rent = getCategoryAmount('Rent');
        const electricity = getCategoryAmount('Electricity');
        const water = getCategoryAmount('Water');
        const internet = getCategoryAmount('Internet');
        const cleaning = getCategoryAmount('Cleaning');
        const other = getCategoryAmount('Other');
        const totalExpense = rent + electricity + water + internet + cleaning + other;

        const activeCount = allMembers.filter(
          (m) => m.roomNo.toLowerCase() === room.roomNo.toLowerCase() && m.status === 'Active'
        ).length;

        const avgCostPerMember =
          activeCount > 0 ? Math.round((totalExpense / activeCount) * 100) / 100 : 0;

        report.push({
          roomNo: room.roomNo,
          roomName: room.roomName,
          month,
          rent,
          electricity,
          water,
          internet,
          cleaning,
          other,
          totalExpense,
          activeMembersCount: activeCount,
          avgCostPerMember,
        });
      });
    });

    return report;
  }

  public getMemberDueReport(roomNo?: string, month?: string): MemberDueReportItem[] {
    const payments = this.getPayments(roomNo, month);
    const members = this.membersSubject.value;

    return payments.map((p) => {
      const member = members.find(
        (m) => m.id === p.memberId || m.memberName.toLowerCase() === p.memberName.toLowerCase()
      );
      const lastTxn =
        p.transactions && p.transactions.length > 0
          ? p.transactions[p.transactions.length - 1].date
          : undefined;

      return {
        memberId: p.memberId,
        memberName: p.memberName,
        roomNo: p.roomNo,
        month: p.month,
        phone: member ? member.phone : 'N/A',
        calculatedShare: p.calculatedShare,
        paid: p.paid,
        due: p.due,
        status: p.status,
        upiId: member?.upiId || p.upiId,
        lastPaymentDate: lastTxn,
      };
    });
  }

  public getVacatedMembersReport(): VacatedMemberReportItem[] {
    const vacatedMembers = this.membersSubject.value.filter((m) => m.status === 'Vacated');
    const payments = this.paymentsSubject.value;

    return vacatedMembers.map((m) => {
      const join = new Date(m.joinDate);
      const leave = m.leaveDate ? new Date(m.leaveDate) : new Date();
      const diffTime = leave.getTime() - join.getTime();
      const totalStayDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

      const memberPayments = payments.filter(
        (p) => p.memberId === m.id || p.memberName.toLowerCase() === m.memberName.toLowerCase()
      );
      const totalDue = memberPayments.reduce((sum, p) => sum + p.due, 0);

      return {
        memberId: m.memberId,
        memberName: m.memberName,
        roomNo: m.roomNo,
        joinDate: m.joinDate,
        leaveDate: m.leaveDate || 'N/A',
        totalStayDays,
        phone: m.phone,
        email: m.email,
        settlementStatus: totalDue <= 0 ? 'Settled' : 'Pending Dues',
        pendingDueAmount: Math.round(totalDue * 100) / 100,
      };
    });
  }

  public exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      ),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
