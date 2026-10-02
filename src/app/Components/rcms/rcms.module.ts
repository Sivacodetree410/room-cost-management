import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RcmsRoutingModule } from './rcms-routing.module';

import { RcmsPortalComponent } from './rcms-portal/rcms-portal';
import { DashboardComponent } from './dashboard/dashboard';
import { RoomMasterComponent } from './room-master/room-master';
import { MemberAllocationComponent } from './member-allocation/member-allocation';
import { ExpenseEntryComponent } from './expense-entry/expense-entry';
import { CostSplitComponent } from './cost-split/cost-split';
import { PaymentScreenComponent } from './payment-screen/payment-screen';
import { ReportsComponent } from './reports/reports';

@NgModule({
  declarations: [
    RcmsPortalComponent,
    DashboardComponent,
    RoomMasterComponent,
    MemberAllocationComponent,
    ExpenseEntryComponent,
    CostSplitComponent,
    PaymentScreenComponent,
    ReportsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RcmsRoutingModule,
  ],
})
export class RcmsModule {}
