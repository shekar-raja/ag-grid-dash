import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PolicyHoldersComponent } from './dashboard/policy-holders/policy-holders.component';
import { HttpClientModule } from '@angular/common/http';
import { AgGridModule } from 'ag-grid-angular';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatTabsModule } from '@angular/material/tabs';

import { DashboardComponent } from './dashboard/dashboard.component';
import { OpportunitiesComponent } from './dashboard/opportunities/opportunities.component';
import { PoliciesComponent } from './dashboard/policies/policies.component';
import { SearchComponent } from './search/search.component';
import { ProposalsComponent } from './dashboard/proposals/proposals.component';

ModuleRegistry.registerModules([
  AllCommunityModule, // or AllEnterpriseModule
]);
@NgModule({
  declarations: [			
    AppComponent,
    PolicyHoldersComponent,
    DashboardComponent,
    OpportunitiesComponent,
    PoliciesComponent,
    SearchComponent,
    ProposalsComponent
   ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    MatTabsModule,
    AgGridModule,
  ],
  providers: [
    provideClientHydration(),
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
