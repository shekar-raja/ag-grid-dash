import { Component, OnInit } from '@angular/core';
import { SharedService } from '../shared.service';

@Component({
  selector: 'app-proposals',
  templateUrl: './proposals.component.html',
  styleUrls: ['./proposals.component.css']
})
export class ProposalsComponent implements OnInit {

  proposals: any[] = [];
  columnDefs = [
    { field: 'ProposalID', headerName: 'ID', sortable: true, filter: true },
    { field: 'ClientName', headerName: 'Client Name', sortable: true, filter: true },
    { field: 'Description', headerName: 'Description', sortable: true, filter: true },
    { field: 'PremiumAmount', headerName: 'Premium Amount', sortable: true, filter: true },
    { field: 'Status', headerName: 'Status', sortable: true, filter: true },
    { field: 'ProposalDate', headerName: 'Proposal Date', sortable: true, filter: true }
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
