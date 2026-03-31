import { NgxMarqueeComponent, OmMarqueeItemDirective } from '@omnedia/ngx-marquee';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { DashboardService } from '@/services/dashboard.service';
import { DecimalPipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MessageModule } from "primeng/message";
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { TagModule } from "primeng/tag";

@Component({
  selector: 'app-dashboard',
  templateUrl: "./dashboard.html",
  imports: [
    OmMarqueeItemDirective,
    AnimateOnScrollModule,
    NgxMarqueeComponent,
    MessageModule,
    ChartModule,
    ChipModule,
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

  constructor () {
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

  protected get data_dh() {
    return this.service.distrubuion_horaria_valor()
  }

  protected get data_ta() {
    return this.service.top_actividades();
  }

  protected get data_ed() {
    return this.service.evolucion_diaria();
  }

  protected get data_rb() {
    return this.service.rendimiento_brigada();
  }

  protected get data_afa() {
    return this.service.analisis_fallidas_accion();
  }

  protected get data_fa() {
    return this.service.fecha_acualizacion();
  }

  protected get options_afa() {
    return this.service.options_analisis_fallidas_accion;
  }

  protected get options_ed() {
    return this.service.options_evolucion_diaria;
  }

  protected get options_dh() {
    return this.service.options_distribucion_horaria;
  }

  protected get filters_afa() {
    return this.service.afa();
  }

  protected on_afa_remove(index:number) {
    const data = this.service.afa();
    data.splice(index, 1);

    this.service.afa.set(data);
    this.service.load_dataset();
  }

  protected get filters_ed() {
    return this.service.ed();
  }

  protected on_ed_remove(index:number) {
    const data = this.service.ed();
    data.splice(index, 1);

    this.service.ed.set(data);
    this.service.load_dataset();
  }
}
