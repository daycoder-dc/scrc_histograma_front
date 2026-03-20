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
    return this.mano_obra.peridos();
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

  protected on_proyectos() {
    const proyectos = this.form.controls.proyectos.value;

    this.form.controls.periodos.reset();
    this.mano_obra.fetch_periodos({proyectos});
  }

  protected on_periodos() {
    const proyectos = this.form.controls.proyectos.value;
    const periodos = this.form.controls.periodos.value;

    this.mano_obra.fetch_brigadas({proyectos, periodos});
  }

  protected on_brigadas() {
    const proyectos = this.form.controls.proyectos.value;
    const periodos = this.form.controls.periodos.value;
    const brigadas = this.form.controls.brigadas.value;

    this.mano_obra.fetch_tecnicos({proyectos, periodos, brigadas});
  }

  protected on_tecnicos() {

  }
}
