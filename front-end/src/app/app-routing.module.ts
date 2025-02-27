import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PolicyHoldersComponent } from './policy-holders/policy-holders.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { OpportunitiesComponent } from './opportunities/opportunities.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'policyholders', component: PolicyHoldersComponent },
  { path: 'opportunities', component: OpportunitiesComponent }
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
