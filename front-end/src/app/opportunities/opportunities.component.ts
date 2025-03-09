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
    { field: 'OpportunityID', headerName: 'ID', sortable: true, filter: true },
    { field: 'ClientName', headerName: 'Client Name', sortable: true, filter: true },
    { field: 'Description', headerName: 'Description', sortable: true, filter: true },
    { field: 'Amount', headerName: 'Amount', sortable: true, filter: true },
    { field: 'Status', headerName: 'Status', sortable: true, filter: true },
    { field: 'CreatedDate', headerName: 'CreatedDate', sortable: true, filter: true }
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
