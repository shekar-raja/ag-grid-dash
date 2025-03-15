import { Component, OnInit } from '@angular/core';
import { SharedService } from '../shared.service';
import { constants } from '../constants';

@Component({
  selector: 'app-proposals',
  templateUrl: './proposals.component.html',
  styleUrls: ['./proposals.component.css']
})
export class ProposalsComponent implements OnInit {

  theme = constants.tableTheme;
  proposals: any[] = [];
  columnDefs = [
    { field: 'proposalId', headerName: 'ID', sortable: true, filter: true },
    { field: 'clientName', headerName: 'Client Name', sortable: true, filter: true },
    { field: 'description', headerName: 'Description', sortable: true, filter: true },
    { field: 'premiumAmount', headerName: 'Premium Amount', sortable: true, filter: true },
    { field: 'status', headerName: 'Status', sortable: true, filter: true },
    { field: 'proposalDate', headerName: 'Proposal Date', sortable: true, filter: true }
  ];

  constructor(
    private _sharedService: SharedService
  ) { }

  ngOnInit() {
    this.getProposals();
  }

  getProposals() {
    this._sharedService.getProposals().subscribe((response: any) => {
      this.proposals = response;
    });
  }

}
