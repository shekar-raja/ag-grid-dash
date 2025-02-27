import { Component, OnInit } from '@angular/core';
import { SharedService } from '../shared.service';
import { constants } from '../constants';

@Component({
  selector: 'app-policies',
  templateUrl: './policies.component.html',
  styleUrls: ['./policies.component.css']
})
export class PoliciesComponent implements OnInit {

  theme = constants.tableTheme;
  policies: any[] = [];
  columnDefs = [
    { field: 'PolicyID', headerName: 'ID', sortable: true, filter: true },
    { field: 'HolderID', headerName: 'Holder ID', sortable: true, filter: true },
    { field: 'PolicyType', headerName: 'Policy Type', sortable: true, filter: true },
    { field: 'CoverageAmount', headerName: 'Coverage Amount', sortable: true, filter: true },
    { field: 'Status', headerName: 'Status', sortable: true, filter: true },
    { field: 'StartDate', headerName: 'Start Date', sortable: true, filter: true },
    { field: 'EndDate', headerName: 'End Date', sortable: true, filter: true }
  ];

  constructor(
    private _sharedService: SharedService
  ) { }

  ngOnInit() {
    this.getPolicies();
  }

  getPolicies() {
    this._sharedService.getPolicies().subscribe((response: any) => {
      this.policies = response;
    });
  }

}
