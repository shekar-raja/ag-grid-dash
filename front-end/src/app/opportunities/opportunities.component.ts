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
    { field: 'leadId', headerName: 'Lead ID', sortable: true, filter: true },
    { field: 'leadName', headerName: 'Lead Name', sortable: true, filter: true },
    { field: 'status', headerName: 'Status', sortable: true, filter: true },
    { field: 'phone', headerName: 'Phone No.', sortable: true, filter: true },
    { field: 'email', headerName: 'Email', sortable: true, filter: true },
    { field: 'priority', headerName: 'Priority', sortable: true, filter: true },
    { field: 'lastInteraction', headerName: 'Last Interaction', sortable: true, filter: true },
    { field: 'followUp', headerName: 'Next Follow Up', sortable: true, filter: true },
    { field: 'source', headerName: 'Source', sortable: true, filter: true },
    { field: 'comments', headerName: 'Comments', sortable: true, filter: true }
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
