import { Component, OnInit } from '@angular/core';
import { SharedService } from '../shared.service';
import type { ColDef } from "ag-grid-community";
import { constants } from '../constants';

@Component({
  selector: 'app-opportunities',
  templateUrl: './opportunities.component.html',
  styleUrls: ['./opportunities.component.css']
})
export class OpportunitiesComponent implements OnInit {

  theme = constants.tableTheme;
  opportunities: any[] = [];
  columnDefs = [
    { field: 'Lead ID', headerName: 'Lead ID', sortable: true, filter: true },
    { field: 'Lead Name', headerName: 'Lead Name', sortable: true, filter: true },
    { field: 'Status', headerName: 'Status', sortable: true, filter: true },
    // { field: 'Phone No.', headerName: 'Phone No.', sortable: true, filter: true },
    { field: 'Email', headerName: 'Email', sortable: true, filter: true },
    { field: 'Priority', headerName: 'Priority', sortable: true, filter: true },
    { field: 'Last Interaction', headerName: 'Last Interaction', sortable: true, filter: true },
    { field: 'Next Follow up', headerName: 'Next Follow Up', sortable: true, filter: true },
    { field: 'Source', headerName: 'Source', sortable: true, filter: true },
    { field: 'Comments', headerName: 'Comments', sortable: true, filter: true }
  ];

  defaultColDef: ColDef = {
    editable: true,
    flex: 1,
    minWidth: 100,
    filter: true,
  };

  constructor(private _sharedService: SharedService) { }

  ngOnInit() {
    this.getOpportunities();
  }

  getOpportunities() {
    this._sharedService.getOpportunities().subscribe((response: any) => {
      this.opportunities = response;
    })
  }

}
