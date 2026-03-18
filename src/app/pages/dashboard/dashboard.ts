import { NgxMarqueeComponent, OmMarqueeItemDirective } from '@omnedia/ngx-marquee';
import { DecimalPipe, NgClass } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-dashboard',
  imports: [
    OmMarqueeItemDirective,
    NgxMarqueeComponent,
    ChartModule,
    CardModule,
    DecimalPipe,
    TableModule,
    NgClass,
  ],
  templateUrl: "./dashboard.html"
})
export class Dashboard {
  protected data_indicadores: any[] = [];
  protected data_distribucion_horaria: any = {};
  protected data_tipo_actividades: any = []
  protected options_distribucion_horaria: any = {};

  constructor() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    this.data_indicadores = [
      {
        value: 27234,
        description: "Total ordenes",
        color: "text-white",
        background: true,
        modeda: false
      },
      {
        value: 20420,
        description: "Efectivas",
        color: "text-blue-700",
        background: false,
        modeda: false
      },
      {
        value: 4574,
        description: "Fallida C/Pago",
        color: "text-blue-500",
        background: false,
        modeda: false
      },
      {
        value: 2240,
        description: "Sin recaudación",
        color: "text-red-500",
        background: false,
        modeda: false
      },
      {
        value: 629785227,
        description: "Recaudación",
        color: "text-green-500",
        background: false,
        modeda: true
      }
    ];

    this.data_distribucion_horaria = {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      datasets: [
        {
          type: 'line',
          label: 'Dataset 1',
          borderColor: documentStyle.getPropertyValue('--p-orange-500'),
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          data: [50, 25, 12, 48, 56, 76, 42]
        },
        {
          type: 'bar',
          label: 'Dataset 2',
          backgroundColor: documentStyle.getPropertyValue('--p-gray-500'),
          data: [21, 84, 24, 75, 37, 65, 34],
          borderColor: 'white',
          borderWidth: 2
        },
        {
          type: 'bar',
          label: 'Dataset 3',
          backgroundColor: documentStyle.getPropertyValue('--p-cyan-500'),
          data: [41, 52, 24, 74, 23, 21, 32]
        }
      ]
    };

    this.options_distribucion_horaria = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder
          }
        },
        y: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder
          }
        }
      }
    }
  }
}
