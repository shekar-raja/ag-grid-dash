import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SharedService } from '../shared.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
  query: string = '';
  loading: boolean = false;

  @Output() resultsEvent = new EventEmitter<any>();

  constructor(private _sharedService: SharedService) {}

  ngOnInit() {
  }

  onSearch() {
    if (!this.query.trim()) return;

    this.loading = true;
    try {
      this._sharedService.search(this.query).subscribe((response: any) => {
        this.resultsEvent.emit(response && response.results? response.results : null);
      })
    } catch (error) {
      console.error('Search error:', error);
    }
    this.loading = false;
  }

}
