import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as d3 from 'd3';
import { OrgChart } from 'd3-org-chart';
import * as Papa from 'papaparse';

interface OrgChartData {
  id: string;
  name: string;
  positionName: string;
  office: string;
  manager?: string;
  _directSubordinates?: number;
  children?: OrgChartData[];
}

@Component({
  selector: 'app-org-chart',
  template: `
    <div class="org-chart-container">
      <div class="search-container">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          (input)="searchEmployees()"
          placeholder="🔍 Search employees"
          class="search-input"
        >
      </div>
      <div #d3Container class="d3-chart-container"></div>
    </div>
  `,
  styleUrls: ['./org-chart.component.css']
})
export class OrgChartComponent implements OnInit {
  @ViewChild('d3Container', { static: true }) d3Container!: ElementRef;
 
  data: OrgChartData[] = [];
  chart: OrgChart<OrgChartData> | null = null;
  searchTerm = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadChartData();
  }

  loadChartData() {
    this.http.get('https://raw.githubusercontent.com/bumbeishvili/sample-data/main/org.csv', { responseType: 'text' })
      .subscribe(csvData => {
        const parsedData = Papa.parse(csvData, { header: true }).data as OrgChartData[];
        this.data = parsedData
          .filter(item => item.name)
          .map(item => ({
            ...item,
            _directSubordinates: this.getDirectSubordinates(item.id, parsedData)
          }));
        this.renderChart();
      });
  }

  getDirectSubordinates(managerId: string, data: OrgChartData[]): number {
    return data.filter(item => item.manager === managerId).length;
  }

  renderChart() {
    if (!this.chart) {
      this.chart = new OrgChart();
    }
    this.chart
      .container(this.d3Container.nativeElement)
      .data(this.data)
      .nodeWidth(() => 280)
      .nodeHeight(() => 280)
      .initialZoom(0.7)
      .buttonContent(({ node }) => this.renderButtonContent(node))
      .nodeContent(node => this.renderNodeContent(node))
      .nodeUpdate((d, i, nodes) => this.setupNodeInteractions(d, nodes[i]))
      .render();
  }

  renderButtonContent(node: any): string {
    const directSubordinates = node.data._directSubordinates || 0;
    const hasChildren = node.children && node.children.length > 0;
    return `
      <div class="node-subordinates-badge" style="background-color: #ec6608; color: white; padding: 4px 8px; border-radius: 4px;">
        ${hasChildren ? '↑' : '↓'}
        <span>${directSubordinates}</span>
      </div>
    `;
  }

  renderNodeContent(node: any): string {
    return `
      <div class="node-card__wrapper" style="background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px; padding: 16px;">
        <div class="node-card__name" style="background-color: #2c3e50; color: white; padding: 12px; border-radius: 4px 4px 0 0;">
          <h3 style="font-size: 16px; font-weight: 600; margin: 0;">${node.data.name}</h3>
        </div>
        <div class="node-card__type" style="background-color: #ec6608; color: white; padding: 4px 8px; border-radius: 20px; font-size: 14px; margin: 12px 0;">${node.data.positionName}</div>
        <div class="node-card__details" style="background-color: #f4f6f7; padding: 12px;">
          <p style="display: flex; justify-content: space-between; font-size: 14px; margin: 6px 0;">
            <b style="opacity: 0.7;">ID</b>
            <span>${node.data.id}</span>
          </p>
          <p style="display: flex; justify-content: space-between; font-size: 14px; margin: 6px 0;">
            <b style="opacity: 0.7;">Office</b>
            <span>${node.data.office}</span>
          </p>
        </div>
      </div>
    `;
  }

  setupNodeInteractions(this: OrgChartComponent, d: any, event: any) {
    const nodeElement = d3.select(event.currentTarget);
   
    nodeElement.select('.node-card__name')
      .on('click', () => this.centerElement(d.id));
   
    nodeElement.select('.node-rect')
      .attr('stroke', (d: any) => d.data._highlighted ? '#152785' : 'none');
  }

  centerElement(id: string) {
    if (this.chart) {
      this.chart.clearHighlighting();
      this.chart.setHighlighted(id).render();
    }
  }

  searchEmployees() {
    if (!this.chart || !this.searchTerm) return;
    
    const matchedEmployees = this.data.filter(emp =>
      emp.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    if (matchedEmployees.length > 0) {
      // Center on the first matched employee
      this.centerElement(matchedEmployees[0].id);
    }
  }
}