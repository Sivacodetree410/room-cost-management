import { Component, OnInit } from '@angular/core';
import { RoomCostService } from '../../../Services/room-cost.service';
import { MemberAllocation, Room, MemberStatus } from '../../../models/room-cost.model';

@Component({
  selector: 'app-member-allocation',
  standalone: false,
  templateUrl: './member-allocation.html',
  styleUrl: './member-allocation.css',
})
export class MemberAllocationComponent implements OnInit {
  members: MemberAllocation[] = [];
  rooms: Room[] = [];
  filteredMembers: MemberAllocation[] = [];

  searchTerm: string = '';
  statusFilter: string = 'ALL';
  roomFilter: string = 'ALL';

  // Modals
  isAllocateModalOpen = false;
  isVacateModalOpen = false;
  isEditModalOpen = false;

  // Selected Member for Actions
  selectedMember: MemberAllocation | null = null;
  vacateLeaveDate: string = new Date().toISOString().split('T')[0];

  // Allocate Form for Bachelor Roommate
  allocateForm = {
    memberName: '',
    phone: '',
    email: '',
    roomNo: 'Room 101',
    joinDate: new Date().toISOString().split('T')[0],
    collegeOrCompany: '',
    hometown: '',
    upiId: '',
    depositPaid: 0,
    emergencyContact: '',
    notes: '',
  };

  // Edit Form
  editForm: MemberAllocation = {
    id: '',
    memberId: '',
    memberName: '',
    phone: '',
    email: '',
    roomNo: '',
    joinDate: '',
    leaveDate: null,
    status: 'Active',
  };

  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';

  constructor(private rcmsService: RoomCostService) {}

  ngOnInit(): void {
    this.rcmsService.members$.subscribe((data) => {
      this.members = data;
      this.applyFilter();
    });

    this.rcmsService.rooms$.subscribe((data) => {
      this.rooms = data;
      if (this.rooms.length > 0 && !this.allocateForm.roomNo) {
        this.allocateForm.roomNo = this.rooms[0].roomNo;
      }
    });
  }

  applyFilter(): void {
    let list = [...this.members];

    if (this.statusFilter !== 'ALL') {
      list = list.filter((m) => m.status === this.statusFilter);
    }

    if (this.roomFilter !== 'ALL') {
      list = list.filter((m) => m.roomNo.toLowerCase() === this.roomFilter.toLowerCase());
    }

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(
        (m) =>
          m.memberName.toLowerCase().includes(q) ||
          m.roomNo.toLowerCase().includes(q) ||
          m.phone.toLowerCase().includes(q) ||
          (m.collegeOrCompany && m.collegeOrCompany.toLowerCase().includes(q)) ||
          (m.hometown && m.hometown.toLowerCase().includes(q))
      );
    }

    this.filteredMembers = list;
  }

  openAllocateModal(): void {
    this.allocateForm = {
      memberName: '',
      phone: '',
      email: '',
      roomNo: this.rooms[0]?.roomNo || 'Room 101',
      joinDate: new Date().toISOString().split('T')[0],
      collegeOrCompany: '',
      hometown: '',
      upiId: '',
      depositPaid: 0,
      emergencyContact: '',
      notes: '',
    };
    this.isAllocateModalOpen = true;
  }

  closeAllocateModal(): void {
    this.isAllocateModalOpen = false;
  }

  submitAllocation(): void {
    if (!this.allocateForm.memberName.trim()) {
      this.showToast('Please enter roommate name.', 'error');
      return;
    }
    if (!this.allocateForm.roomNo) {
      this.showToast('Please select room.', 'error');
      return;
    }
    if (!this.allocateForm.joinDate) {
      this.showToast('Please select join date.', 'error');
      return;
    }

    const res = this.rcmsService.allocateMember({
      memberId: 'BR-' + (this.members.length + 101),
      memberName: this.allocateForm.memberName.trim(),
      phone: this.allocateForm.phone || '+91 90000 00000',
      email: this.allocateForm.email || `${this.allocateForm.memberName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      roomNo: this.allocateForm.roomNo,
      joinDate: this.allocateForm.joinDate,
      leaveDate: null,
      status: 'Active',
      collegeOrCompany: this.allocateForm.collegeOrCompany,
      hometown: this.allocateForm.hometown,
      upiId: this.allocateForm.upiId,
      depositPaid: this.allocateForm.depositPaid,
      emergencyContact: this.allocateForm.emergencyContact,
      notes: this.allocateForm.notes,
    });

    if (res.success) {
      this.showToast(res.message, 'success');
      this.closeAllocateModal();
    } else {
      this.showToast(res.message, 'error');
    }
  }

  openVacateModal(member: MemberAllocation): void {
    this.selectedMember = member;
    this.vacateLeaveDate = new Date().toISOString().split('T')[0];
    this.isVacateModalOpen = true;
  }

  closeVacateModal(): void {
    this.isVacateModalOpen = false;
    this.selectedMember = null;
  }

  confirmVacate(): void {
    if (!this.selectedMember) return;
    if (!this.vacateLeaveDate) {
      this.showToast('Please choose valid vacate date.', 'error');
      return;
    }

    const res = this.rcmsService.vacateMember(this.selectedMember.id, this.vacateLeaveDate);
    if (res.success) {
      this.showToast(res.message, 'success');
      this.closeVacateModal();
    } else {
      this.showToast(res.message, 'error');
    }
  }

  openEditModal(member: MemberAllocation): void {
    this.editForm = JSON.parse(JSON.stringify(member));
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
  }

  saveEdit(): void {
    const ok = this.rcmsService.updateMember(this.editForm);
    if (ok) {
      this.showToast(`Updated details for roommate ${this.editForm.memberName}!`, 'success');
      this.closeEditModal();
    } else {
      this.showToast('Failed to update roommate.', 'error');
    }
  }

  deleteAllocation(member: MemberAllocation): void {
    if (confirm(`Remove roommate record for ${member.memberName}?`)) {
      this.rcmsService.deleteMemberAllocation(member.id);
      this.showToast(`Record for ${member.memberName} removed.`, 'success');
    }
  }

  getRoomCapacityInfo(roomNo: string): string {
    const r = this.rooms.find((room) => room.roomNo.toLowerCase() === roomNo.toLowerCase());
    if (!r) return '';
    return `(${r.currentMembers}/${r.maxCapacity} cots taken)`;
  }

  calculateDurationDays(joinDate: string, leaveDate: string | null): number {
    const start = new Date(joinDate);
    const end = leaveDate ? new Date(leaveDate) : new Date();
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
  }

  getActiveCount(): number {
    return this.members.filter((m) => m.status === 'Active').length;
  }

  getVacatedCount(): number {
    return this.members.filter((m) => m.status === 'Vacated').length;
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }
}
