import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PolicyHoldersComponent } from './dashboard/policy-holders/policy-holders.component';
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: 'policyholders', pathMatch: 'full' },
  { path: 'policyholders', component: PolicyHoldersComponent },
  { path: 'dashboard', component: DashboardComponent }
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
