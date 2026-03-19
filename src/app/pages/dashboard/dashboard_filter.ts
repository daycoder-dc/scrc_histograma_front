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
  template: `
    <div class="flex flex-col gap-3 pt-3" [formGroup]="form">
      <!-- Periodo -->
      <div class="flex flex-col gap-2">
        <label for="periodo">Periodo</label>
        <p-multi-select
          formControlName="periodos"
          optionLabel="periodo"
          optionValue="periodo"
          placeholder="Seleccionar"
          [showClear]="true"
          [fluid]="true"
          [options]="periodos"
          (onChange)="on_periodos()" />
      </div>

      <!-- Zona -->
      <div class="flex flex-col gap-2">
        <label for="zonas">Zonas</label>
        <p-multi-select
          formControlName="zonas"
          optionLabel="zona"
          optionValue="zona"
          placeholder="Seleccionar"
          [showClear]="true"
          [fluid]="true"
          [options]="zonas"
          (onChange)="on_zonas()" />
      </div>

      <!-- Brigadas -->
      <div class="flex flex-col gap-2">
        <label for="brigadas">Brigadas</label>
        <p-multi-select optionLabel="name" placeholder="Seleccionar" [fluid]="true" [options]="brigadas" />
      </div>

      <!-- Tecnicos -->
      <div class="flex flex-col gap-2">
        <label for="brigadas">Técnicos</label>
        <p-multi-select optionLabel="name" placeholder="Seleccionar" [fluid]="true" [options]="tecnicos" />
      </div>

      <!-- Actividad -->
      <div class="flex flex-col gap-2">
        <label for="brigadas">Actividad</label>
        <p-multi-select optionLabel="name" placeholder="Seleccionar" [fluid]="true" [options]="actividad" />
      </div>
    </div>
  `
})
export class DashboardFilter {
  private readonly mano_obra = inject(ManoObraDataService);

  protected get periodos() {
    return this.mano_obra.peridos();
  }

  protected get zonas() {
    return this.mano_obra.zonas();
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

  protected on_periodos() {
    const periodos = this.form.controls.periodos.value;

    this.mano_obra.fetch_zonas(periodos);
    this.form.controls.zonas.reset();
  }

  protected on_zonas() {
    const periodos = this.form.controls.periodos.value;
    const zonas = this.form.controls.zonas.value;

    this.mano_obra.fetch_brigadas(periodos, zonas);
  }
}
