import { Component, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  pageTitle = 'Dashboard';
  sidenavOpened = true;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateTitleBasedOnRoute(event.urlAfterRedirects);
      }
    });
  }

  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
  }

  updateTitle(title: string) {
    this.pageTitle = title;
  }

  private updateTitleBasedOnRoute(url: string) {
    switch (url) {
      case '/dashboard':
        this.pageTitle = 'Dashboard';
        break;
      case '/opportunities':
        this.pageTitle = 'Opportunities';
        break;
      case '/policy-holders':
        this.pageTitle = 'Policy Holders';
        break;
      case '/policies':
        this.pageTitle = 'Policies';
        break;
      default:
        this.pageTitle = 'Dashboard';
    }
  }
}
