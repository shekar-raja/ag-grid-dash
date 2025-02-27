import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() pageTitle: string = 'Dashboard';
  @Output() toggleSidebar = new EventEmitter<void>();

  toggleSidenav() {
    this.toggleSidebar.emit();
  }
}