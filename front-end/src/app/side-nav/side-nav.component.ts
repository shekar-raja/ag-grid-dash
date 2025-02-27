import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css']
})
export class SideNavComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @Output() pageTitleChange = new EventEmitter<string>();
  sidenavOpened = true;

  toggleSidenav() {
    this.sidenav.toggle();
  }

  updateTitle(title: string) {
    this.pageTitleChange.emit(title);
  }
}