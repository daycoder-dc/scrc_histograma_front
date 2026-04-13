import { DashboardService } from "@/services/dashboard.service";
import { Component, effect, inject, model, signal } from "@angular/core";
import { EstadoOrdenes, HistoryData } from "@/config/typing";
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { Button } from "primeng/button";

@Component({
  selector: "app-dashbaord-datasetview",
  templateUrl: "./dataset-view.html",
  imports: [
    DialogModule,
    TableModule,
    Button
  ]
})
export class DashboardDatasetView {
  public readonly visible = model.required<boolean>();
  public readonly description = model.required<string>();
  protected readonly current = signal("");
  protected readonly data = signal<HistoryData[]>([]);

  protected readonly cols = [
    { field: "nic", header: "Nic" },
    { field: "orden", header: "Orden" },
    { field: "zona", header: "Zone" },
    { field: "tipo_brigada", header: "Tipo brigada" },
    { field: "tecnico", header: "Tecnico" },
    { field: "periodo", header: "Periodo" },
    { field: "periodo_dia", header: "Dia" },
    { field: "hora", header: "Hora" },
    { field: "estado", header: "Estado" },
    { field: "valor_unitario", header: "Valor unitario" },
    { field: "tipo_actividad", header: "Tipo actividad" },
    { field: "accion", header: "Accion" },
  ]

  protected readonly service = inject(DashboardService);

  constructor() {
    effect(() => {
      const desc = this.description();
      const current = this.current();

      if (desc != current) {
        const dataset = this.service.table();

        if (desc == "Total ordenes") {
          this.data.set(dataset);
        }
        else if (desc == "Efectivas") {
          const data = dataset.filter(it => it.estado == EstadoOrdenes.EFECTIVA);
          this.data.set(data);
        }
        else if (desc == "Fallida C/Pago") {
          const data = dataset.filter(it => it.estado == EstadoOrdenes.FALLIDA_PAGA);
          this.data.set(data);
        }
        else if (desc == "Sin recaudación") {
          const data = dataset.filter(it => it.estado == EstadoOrdenes.FALLIDA);
          this.data.set(data);
        }

        this.current.set(desc);
      }
    });
  }
}
