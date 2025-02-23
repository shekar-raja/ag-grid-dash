import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from './environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  constructor(
    private _http: HttpClient
  ) { }

  getPolicyHolders() {
    return this._http.get(environment.url + "api/policyholders");
  }

  getOpportunities() {
    return this._http.get(environment.url + "api/opportunities");
  }

  getPolicies() {
    return this._http.get(environment.url + "api/policies");
  }

  getProposals() {
    return this._http.get(environment.url + "api/proposals")
  }

}
