import { NgxMarqueeComponent, OmMarqueeItemDirective } from '@omnedia/ngx-marquee';
import { ManoObraDataService } from '@/services/mano-obra-data';
import { DecimalPipe, NgClass } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
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
  private readonly mano_obra = inject(ManoObraDataService);

  protected data_indicadores = computed(() => [
    {
      value: this.mano_obra.total_ordenes(),
      description: "Total ordenes",
      color: "text-white",
      background: true,
      modeda: false
    },
    {
      value: this.mano_obra.efectivas(),
      description: "Efectivas",
      color: "text-primary",
      background: false,
      modeda: false
    },
    {
      value: this.mano_obra.fallidas_pago(),
      description: "Fallida C/Pago",
      color: "text-primary",
      background: false,
      modeda: false
    },
    {
      value: this.mano_obra.sin_recaudacion(),
      description: "Sin recaudación",
      color: "text-red-500",
      background: false,
      modeda: false
    },
    {
      value: this.mano_obra.recaudacion(),
      description: "Recaudación",
      color: "text-green-500",
      background: false,
      modeda: true
    }
  ])

  protected data_distribucion_horaria: any = {};
  protected data_tipo_actividades: any = []
  protected options_distribucion_horaria: any = {};

  constructor() {
    this.data_distribucion_horaria = {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      datasets: [
        {
          type: 'line',
          label: 'Dataset 1',
          // borderColor: documentStyle.getPropertyValue('--p-orange-500'),
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          data: [50, 25, 12, 48, 56, 76, 42]
        },
        {
          type: 'bar',
          label: 'Dataset 2',
          // backgroundColor: documentStyle.getPropertyValue('--p-gray-500'),
          data: [21, 84, 24, 75, 37, 65, 34],
          borderColor: 'white',
          borderWidth: 2
        },
        {
          type: 'bar',
          label: 'Dataset 3',
          // backgroundColor: documentStyle.getPropertyValue('--p-cyan-500'),
          data: [41, 52, 24, 74, 23, 21, 32]
        }
      ]
    };

    this.options_distribucion_horaria = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      // plugins: {
      //   legend: {
      //     labels: {
      //       // color: textColor
      //     }
      //   }
      // },
      // scales: {
      //   x: {
      //     ticks: {
      //       // color: textColorSecondary
      //     },
      //     grid: {
      //       // color: surfaceBorder
      //     }
      //   },
      //   y: {
      //     ticks: {
      //       // color: textColorSecondary
      //     },
      //     grid: {
      //       // color: surfaceBorder
      //     }
      //   }
      // }
    }
  }

  protected ngOnInit() {
    this.mano_obra.fetch_data();
  }
}
