import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RcmsPortalComponent } from './rcms-portal/rcms-portal';
import { DashboardComponent } from './dashboard/dashboard';
import { RoomMasterComponent } from './room-master/room-master';
import { MemberAllocationComponent } from './member-allocation/member-allocation';
import { ExpenseEntryComponent } from './expense-entry/expense-entry';
import { CostSplitComponent } from './cost-split/cost-split';
import { PaymentScreenComponent } from './payment-screen/payment-screen';
import { ReportsComponent } from './reports/reports';

const routes: Routes = [
  {
    path: '',
    component: RcmsPortalComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'rooms', component: RoomMasterComponent },
      { path: 'allocations', component: MemberAllocationComponent },
      { path: 'expenses', component: ExpenseEntryComponent },
      { path: 'split', component: CostSplitComponent },
      { path: 'payments', component: PaymentScreenComponent },
      { path: 'reports', component: ReportsComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RcmsRoutingModule {}
