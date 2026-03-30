import { NgxMarqueeComponent,
  OmMarqueeItemDirective } from '@omnedia/ngx-marquee';
import { DashboardService } from '@/services/dashboard.service';
import { DecimalPipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MessageModule } from "primeng/message";
import { ChartOptions, Chart } from "chart.js";
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { TagModule } from "primeng/tag";

import chartDataLabels from "chartjs-plugin-datalabels";

@Component({
  selector: 'app-dashboard',
  templateUrl: "./dashboard.html",
  imports: [
    OmMarqueeItemDirective,
    NgxMarqueeComponent,
    MessageModule,
    ChartModule,
    DecimalPipe,
    TableModule,
    ToastModule,
    CardModule,
    TagModule,
    NgClass,
  ],
  providers: [
    MessageService
  ]
})
export class Dashboard {
  private readonly service = inject(DashboardService);
  private readonly alert = inject(MessageService);

  protected readonly options_distribucion_horaria: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 0.6,
    plugins: {
      title: { display: true, text: "Distribución Horaria y Valor" },
      datalabels: { display: false }
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: { display: true, text: "Cantidad de OS" }
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        grid: { drawOnChartArea: false },
        title: { display:true, text: "Recaudación ($)" }
      }
    }
  }

  protected readonly options_evolucion_diaria: ChartOptions<"bar"> = {
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
      title: {display:true, text: "Evolución Diaria (Clic para filtrar)"},
      // tooltip: { mode: "index", intersect: false },
      datalabels: { display: false }
    },
    scales: {
      x: {
        stacked: true,
        title: { display:true, text: "Día del Mes" }
      },
      y: {
        stacked: true,
        title: { display:true, text: "Cantidad" }
      }
    }
  }

  protected readonly options_analisis_fallidas_accion: ChartOptions<"bar"> = {
    indexAxis: "y",
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
      title: { display:true, text: "Análisis de Fallidas por Acción (Click par filtrar)" },
      datalabels: {
        anchor: "end",
        align: "end",
        formatter: (value, ctx) => {
          const total = this.service.efectivas();
          const percentage = (value / total) * 100;

          return percentage.toFixed(0) + "%";
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        title: { display: true, text: "Cantidad de OS" },
      },
      y: {
        stacked: true
      }
    }
  }

  constructor () {
    Chart.register(chartDataLabels);

    this.service.socket.on("FILE_LOAD_SUCCESS", (id:string) => {
      const archivo_id = sessionStorage.getItem("archivo_id");

      if (archivo_id == id) {
        this.alert.add({
          severity: "success",
          summary: "Success",
          detail: "Archivo cargado satisfactoriamente"
        });

        this.service.fetch_data();
      }
    });

    this.service.socket.on("FILE_LOAD_ERROR", (id:string) => {
      const archivo_id  = sessionStorage.getItem("archivo_id");

      if (archivo_id == id) {
        this.alert.add({
          severity: "error",
          summary: "Error",
          detail: "Hubo un error en el procesamiento del archivo."
        });
      }
    });
  }

  protected ngOnInit() {
    this.service.fetch_data();
  }

  protected get indicadores() {
    return this.service.indicadores();
  }

  protected get graph_distribucion_hora_valor() {
    return this.service.distrubuion_horaria_valor()
  }

  protected get top_actividades() {
    return this.service.top_actividades();
  }

  protected get evolucion_diaria() {
    return this.service.evolucion_diaria();
  }

  protected get rendimiento_brigada() {
    return this.service.rendimiento_brigada();
  }

  protected get analisis_fallidas_accion() {
    return this.service.analisis_fallidas_accion();
  }
}
