import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ag-grid-app';
  pageTitle = 'Dashboard';

  toggleSidenav() {
    document.querySelector('app-side-nav')?.classList.toggle('open');
  }

  updateTitle(title: string) {
    this.pageTitle = title;
  }
}
