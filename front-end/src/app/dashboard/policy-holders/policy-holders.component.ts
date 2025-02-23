import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../shared.service';

@Component({
  selector: 'app-policy-holders',
  templateUrl: './policy-holders.component.html',
  styleUrls: ['./policy-holders.component.css']
})
export class PolicyHoldersComponent implements OnInit {

  policyHolders: any[] = [];
  columnDefs = [
    { field: 'HolderID', headerName: 'ID', sortable: true, filter: true },
    { field: 'Name', headerName: 'Name', sortable: true, filter: true },
    { field: 'Email', headerName: 'Email', sortable: true, filter: true },
    { field: 'Phone', headerName: 'Phone', sortable: true, filter: true },
    { field: 'Address', headerName: 'Address', sortable: true, filter: true }
  ];


  constructor(
    private _sharedService: SharedService
  ) { }

  ngOnInit() {
    this.getPolicyHolders();
  }

  getPolicyHolders() {
    this._sharedService.getPolicyHolders().subscribe((response: any) => {
      this.policyHolders = response;
    },
    (error) => console.error('Error fetching policy holders:', error));
  }

}
