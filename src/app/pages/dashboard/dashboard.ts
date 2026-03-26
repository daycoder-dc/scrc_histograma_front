import { NgxMarqueeComponent, OmMarqueeItemDirective } from '@omnedia/ngx-marquee';
import { ManoObraDataService } from '@/services/mano-obra-data';
import { Component, computed, inject } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { TagModule } from "primeng/tag"
import { ChartOptions } from "chart.js"

@Component({
  selector: 'app-dashboard',
  imports: [
    OmMarqueeItemDirective,
    NgxMarqueeComponent,
    ChartModule,
    CardModule,
    DecimalPipe,
    TableModule,
    TagModule,
    NgClass,
  ],
  templateUrl: "./dashboard.html"
})
export class Dashboard {
  private readonly mano_obra = inject(ManoObraDataService);

  protected readonly options_distribucion_horaria: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 0.6,
    plugins: {
      title: { display: true, text: "Distribución Horaria y Valor" }
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {display: true, text: "Cantidad de OS"}
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        grid: {
          drawOnChartArea: false
        },
        title: {display:true, text: "Recaudación ($)"}
      }
    }
  };

  protected readonly options_evolucion_diaria: ChartOptions<"bar"> = {
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
      tooltip: {
        mode: "index",
        intersect: false
      }
    },
    scales: {
      x: {
        stacked: true,
        title: {display:true, text: "Día del Mes"}
      },
      y: {
        stacked: true,
        title: {display:true, text: "Cantidad"}
      }
    }
  }

  protected ngOnInit() {
    this.mano_obra.fetch_data();
  }

  protected get indicadores() {
    return this.mano_obra.indicadores();
  }

  protected get graph_distribucion_hora_valor() {
    return this.mano_obra.distrubuion_horaria_valor()
  }

  protected get top_actividades() {
    return this.mano_obra.top_actividades();
  }

  protected get evolucion_diaria() {
    return this.mano_obra.evolucion_diaria()
  }

  protected get rendimiento_brigada() {
    return this.mano_obra.rendimiento_brigada()
  }
}
