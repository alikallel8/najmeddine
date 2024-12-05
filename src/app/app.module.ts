import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';  // Add this import

import { AppComponent } from './app.component';
import { OrgChartComponent } from './org-chart/org-chart.component';
// github is easy
@NgModule({
  declarations: [
    AppComponent,
    OrgChartComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot([])  // Add this line
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }