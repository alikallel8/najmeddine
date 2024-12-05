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
  _directSubordinates?: number;
  children?: any[];
}

@Component({
  selector: 'app-org-chart',
  template: `
    <div class="org-chart-container">
      <input 
        type="text" 
        [(ngModel)]="searchTerm" 
        (input)="searchEmployees()"
        placeholder="Search employees"
      >
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
    this.http.get('https://raw.githubusercontent.com/bumbeishvili/sample-data/main/org.csv', {responseType: 'text'})
      .subscribe(csvData => {
        const parsedData = Papa.parse(csvData, { header: true }).data as OrgChartData[];
        this.data = parsedData.filter(item => item.name); // Remove empty rows
        this.renderChart();
      });
  }

  renderChart() {
    if (!this.chart) {
      this.chart = new OrgChart();
    }

    this.chart
      .container(this.d3Container.nativeElement)
      .data(this.data)
      .nodeWidth(() => 220)
      .nodeHeight(() => 220)
      .initialZoom(0.8)
      .buttonContent(({ node }) => this.renderButtonContent(node))
      .nodeContent(node => this.renderNodeContent(node))
      .nodeUpdate((d, i, nodes) => this.setupNodeInteractions(d, nodes[i]))
      .render();
  }

  renderButtonContent(node: any): string {
    const directSubordinates = node.data._directSubordinates || 0;
    const hasChildren = node.children && node.children.length > 0;
    return `
      <div style="color: #fff; border-radius: 5px; padding: 3px; font-size: 10px; 
                  margin: auto; background-color: #ec6608; border: none;">
        ${hasChildren ? '↑' : '↓'}
        <span>${directSubordinates}</span>
      </div>
    `;
  }

  renderNodeContent(node: any): string {
    return `
      <div class="node-card__wrapper">
        <div class="node-card__name">
          <h3>${node.data.name}</h3>
        </div>
        <div class="node-card__type">${node.data.positionName}</div>
        <div class="node-card__details">
          <p class="node-card__element"><b>id</b>: ${node.data.id}</p>
          <p class="node-card__element"><b>code</b>: ${node.data.id}</p>
          <p class="node-card__element"><b>country</b>: ${node.data.office}</p>
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
    if (!this.chart) return;

    const matchedEmployee = this.data.find(emp => 
      emp.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    if (matchedEmployee) {
      this.centerElement(matchedEmployee.id);
    }
  }
}