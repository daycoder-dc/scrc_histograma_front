import { DashboardService } from "@/services/dashboard.service";
import { MultiSelectModule } from "primeng/multiselect";
import { ReactiveFormsModule } from "@angular/forms";
import { Component, inject } from "@angular/core";
import { Button } from "primeng/button";

@Component({
  selector: "app-dashboard-filter",
  imports: [
    ReactiveFormsModule,
    MultiSelectModule,
    Button
  ],
  templateUrl: "./filters.html"
})
export class DashboardFilter {
  private readonly service = inject(DashboardService);

  protected get proyectos() {
    return this.service.proyectos();
  }

  protected get periodos() {
    return this.service.periodos();
  }

  protected get brigadas() {
    return this.service.brigadas();
  }

  protected get tecnicos() {
    return this.service.tecnicos();
  }

  protected get actividad() {
    return this.service.actividad();
  }

  protected get form() {
    return this.service.form_filters;
  }

  protected on_load_dataset() {
    this.service.load_dataset();
  }
}
