import { MultiSelectChangeEvent, MultiSelectModule } from "primeng/multiselect";
import { ManoObraDataService } from "@/services/mano-obra-data";
import { ReactiveFormsModule } from "@angular/forms";
import { Component, inject } from "@angular/core";

@Component({
  selector: "app-dashboard-filter",
  imports: [
    ReactiveFormsModule,
    MultiSelectModule
  ],
  templateUrl: "./filters.html"
})
export class DashboardFilter {
  private readonly mano_obra = inject(ManoObraDataService);

  protected get proyectos() {
    return this.mano_obra.proyectos();
  }

  protected get periodos() {
    return this.mano_obra.periodos();
  }

  protected get brigadas() {
    return this.mano_obra.brigadas();
  }

  protected get tecnicos() {
    return this.mano_obra.tecnicos();
  }

  protected get actividad() {
    return this.mano_obra.actividad();
  }

  protected get form() {
    return this.mano_obra.form_filters;
  }
}
