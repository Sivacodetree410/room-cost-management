import { Component, OnInit } from '@angular/core';
import { RoomCostService } from '../../../Services/room-cost.service';
import { Room, MemberAllocation, RoomStatus } from '../../../models/room-cost.model';

@Component({
  selector: 'app-room-master',
  standalone: false,
  templateUrl: './room-master.html',
  styleUrl: './room-master.css',
})
export class RoomMasterComponent implements OnInit {
  rooms: Room[] = [];
  filteredRooms: Room[] = [];
  searchTerm: string = '';
  statusFilter: string = 'ALL';

  // Modal State
  isModalOpen = false;
  isEditMode = false;
  isResidentsModalOpen = false;
  selectedRoom: Room | null = null;
  selectedRoomResidents: MemberAllocation[] = [];

  // Form model
  roomForm: Room = this.getEmptyRoomForm();
  availableAmenities: string[] = [
    'High-Speed Wi-Fi',
    'Drinking Water Dispenser',
    'Attached Bathroom',
    'Balcony with Clothesline',
    'Geyser',
    'Ceiling Fans & Study Tables',
    'Separate Cot & Mattress',
    'Individual Wardrobes',
    'Refrigerator',
    'Shoe Rack',
  ];

  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';

  constructor(private rcmsService: RoomCostService) {}

  ngOnInit(): void {
    this.rcmsService.rooms$.subscribe((data) => {
      this.rooms = data;
      this.applyFilter();
    });
  }

  private getEmptyRoomForm(): Room {
    return {
      roomNo: 'Room 101',
      roomName: 'Bachelors Haven (Boys Sharing)',
      maxCapacity: 3,
      currentMembers: 0,
      baseRent: 9000,
      depositAmount: 20000,
      status: 'Available',
      floor: '1st Floor',
      amenities: [
        'High-Speed Wi-Fi',
        'Drinking Water Dispenser',
        'Attached Bathroom',
        'Balcony with Clothesline',
      ],
      notes: 'Bachelors flat room with 3 cot spaces, separate wardrobes, and balcony.',
      createdAt: new Date().toISOString().split('T')[0],
    };
  }

  applyFilter(): void {
    let list = [...this.rooms];

    if (this.statusFilter !== 'ALL') {
      list = list.filter((r) => r.status === this.statusFilter);
    }

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          r.roomNo.toLowerCase().includes(q) ||
          r.roomName.toLowerCase().includes(q) ||
          (r.floor && r.floor.toLowerCase().includes(q))
      );
    }

    this.filteredRooms = list;
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.roomForm = this.getEmptyRoomForm();
    this.isModalOpen = true;
  }

  openEditModal(room: Room): void {
    this.isEditMode = true;
    this.roomForm = JSON.parse(JSON.stringify(room));
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  toggleAmenity(amenity: string): void {
    if (!this.roomForm.amenities) {
      this.roomForm.amenities = [];
    }
    const idx = this.roomForm.amenities.indexOf(amenity);
    if (idx > -1) {
      this.roomForm.amenities.splice(idx, 1);
    } else {
      this.roomForm.amenities.push(amenity);
    }
  }

  hasAmenity(amenity: string): boolean {
    return !!this.roomForm.amenities && this.roomForm.amenities.includes(amenity);
  }

  saveRoom(): void {
    if (!this.roomForm.roomNo.trim() || !this.roomForm.roomName.trim()) {
      this.showToast('Please enter Room No and Room Name.', 'error');
      return;
    }

    if (this.roomForm.maxCapacity <= 0) {
      this.showToast('Max Cot/Bed Capacity must be at least 1.', 'error');
      return;
    }

    if (this.roomForm.baseRent < 0) {
      this.showToast('Base Room Rent cannot be negative.', 'error');
      return;
    }

    if (this.isEditMode) {
      const ok = this.rcmsService.updateRoom(this.roomForm);
      if (ok) {
        this.showToast(`Bachelor Room ${this.roomForm.roomNo} updated successfully!`, 'success');
        this.closeModal();
      } else {
        this.showToast('Failed to update room.', 'error');
      }
    } else {
      const ok = this.rcmsService.addRoom(this.roomForm);
      if (ok) {
        this.showToast(`Bachelor Room ${this.roomForm.roomNo} added successfully!`, 'success');
        this.closeModal();
      } else {
        this.showToast(`Room ${this.roomForm.roomNo} already exists!`, 'error');
      }
    }
  }

  deleteRoom(room: Room): void {
    if (confirm(`Delete Room ${room.roomNo} (${room.roomName})?`)) {
      const res = this.rcmsService.deleteRoom(room.roomNo);
      if (res.success) {
        this.showToast(res.message, 'success');
      } else {
        this.showToast(res.message, 'error');
      }
    }
  }

  openResidentsModal(room: Room): void {
    this.selectedRoom = room;
    this.selectedRoomResidents = this.rcmsService.getActiveMembersForRoom(room.roomNo);
    this.isResidentsModalOpen = true;
  }

  closeResidentsModal(): void {
    this.isResidentsModalOpen = false;
    this.selectedRoom = null;
    this.selectedRoomResidents = [];
  }

  getTotalCapacity(): number {
    return this.rooms.reduce((sum, r) => sum + r.maxCapacity, 0);
  }

  getTotalOccupants(): number {
    return this.rooms.reduce((sum, r) => sum + r.currentMembers, 0);
  }

  getTotalVacantBeds(): number {
    return Math.max(0, this.getTotalCapacity() - this.getTotalOccupants());
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }
}
