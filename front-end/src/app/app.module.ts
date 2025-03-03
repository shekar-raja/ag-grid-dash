import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PolicyHoldersComponent } from './policy-holders/policy-holders.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AgGridModule } from 'ag-grid-angular';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AgChartsModule } from 'ag-charts-angular';
import { MatCardModule } from '@angular/material/card';

import { SideNavComponent } from './side-nav/side-nav.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { OpportunitiesComponent } from './opportunities/opportunities.component';
import { PoliciesComponent } from './policies/policies.component';
import { SearchComponent } from './search/search.component';
import { ProposalsComponent } from './proposals/proposals.component';
import { HeaderComponent } from './header/header.component';
import { HttpLoaderInterceptor } from './interceptors/http-loader.interceptor';

ModuleRegistry.registerModules([
  AllCommunityModule,
]);
@NgModule({
  declarations: [					
    AppComponent,
    PolicyHoldersComponent,
    DashboardComponent,
    OpportunitiesComponent,
    PoliciesComponent,
    SearchComponent,
    ProposalsComponent,
    SideNavComponent,
    HeaderComponent
   ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    MatTabsModule,
    AgGridModule,
    MatSidenavModule,
    MatIconModule,
    MatToolbarModule,
    MatListModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    AgChartsModule,
    MatCardModule
  ],
  providers: [
    provideClientHydration(),
    provideAnimationsAsync(),
    { provide: HTTP_INTERCEPTORS, useClass: HttpLoaderInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
