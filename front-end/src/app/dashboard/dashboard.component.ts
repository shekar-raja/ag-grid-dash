import { Component, OnInit } from '@angular/core';
import { SharedService } from '../shared.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  opportunitiesChart: any = {};
  proposalsChart: any = {};
  policiesChart: any = {};
  claimsChart: any = {};
  searchResults: any = [];
  
  constructor(
    private _sharedService: SharedService
  ) {}

  ngOnInit() {
    this.loadCharts();
  }

  loadCharts() {
    this._sharedService.getOpportunities().subscribe((response: any) => {
      this.opportunitiesChart = {
        title: { text: 'Opportunities Over Time' },
        data: this.aggregateByMonth(response, 'CreatedDate', 'Amount'),
        series: [{ type: 'line', xKey: 'date', yKey: 'value', yName: 'Amount' }],
        axes: [
          {
            type: 'time',
            position: 'bottom',
            label: { format: '%b %Y', rotation: 45 }
          },
          {
            type: 'number',
            position: 'left',
            label: { formatter: (params: any) => `£${params.value.toLocaleString()}` }
          }
        ]
      };
    });

    this._sharedService.getProposals().subscribe((response: any) => {
      const statusCounts = this.countStatus(response, 'Status');
      this.proposalsChart = {
        title: { text: 'Proposals Status' },
        data: statusCounts,
        series: [{ type: 'bar', xKey: 'status', yKey: 'count' }],
        axes: [{ type: 'category', position: 'bottom' }, { type: 'number', position: 'left' }]
      };

      const claimsCounts = this.countStatus(response, 'Status');
      this.claimsChart = {
        title: {
          text: 'Proposals Ratio',
          fontSize: 16
        },
        data: claimsCounts,
        series: [
          {
            type: 'pie',
            angleKey: 'count',
            labelKey: 'status',
            label: {
              enabled: true,  // Show labels on slices
              color: 'white', // White text for contrast
              fontWeight: 'bold',
              fontSize: 14
            },
            legendItemKey: 'status',
            tooltip: {
              renderer: (params: any) => {
                return {
                  content: `${params.datum.status}: ${params.datum.count}%`
                };
              }
            }
          }
        ],
        legend: {
          enabled: true,
          position: 'right'
        }
      };
    });

    this._sharedService.getPolicies().subscribe((response: any) => {
      let data = this.aggregateByMonth(response, 'StartDate', 'CoverageAmount');
      data = data.map(item => ({
        date: new Date(item.date), // Convert string to Date object
        value: item.value
      })).sort((a, b) => a.date.getTime() - b.date.getTime());;
      this.policiesChart = {
        title: { text: 'Policies Over Time' },
        data: data,
        series: [
          {
            type: 'line',
            xKey: 'date', // X-axis should be the date
            yKey: 'value', // Y-axis should be the value
            stroke: '#007bff',
            marker: {
              size: 5
            }
          }
        ],
        axes: [
          {
            type: 'time', // Use time scale for dates
            position: 'bottom',
            title: {
              text: 'Date'
            }
          },
          {
            type: 'number',
            position: 'left',
            title: {
              text: 'Policy Value'
            }
          }
        ]
      };
    });
  }

  countStatus(data: any[], key: string) {
    const counts: { [key: string]: number } = {};
    data.forEach(item => {
      counts[item[key]] = (counts[item[key]] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }

  aggregateByMonth(data: any[], dateKey: string, valueKey: string) {
    const grouped: { [key: string]: number[] } = {};
    data.forEach(item => {
      const month = new Date(item[dateKey]).toISOString().slice(0, 7);
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(item[valueKey]);
    });
    return Object.entries(grouped).map(([date, values]) => ({
      date: new Date(date),
      value: values.reduce((sum, v) => sum + v, 0) / values.length
    }));
  }

  handleSearchResults(results: any) {
    this.searchResults = results;
  }
}
