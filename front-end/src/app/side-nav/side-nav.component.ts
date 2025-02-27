import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css']
})
export class SideNavComponent {
  @Output() pageTitleChange = new EventEmitter<string>();

  updateTitle(title: string) {
    this.pageTitleChange.emit(title);
  }
}