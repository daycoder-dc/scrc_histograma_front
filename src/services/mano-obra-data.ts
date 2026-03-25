import { FilterItem, ManoObraData } from "@/config/typing";
import { inject, Injectable, signal } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { BlockHttpService } from "./block_http";

@Injectable({providedIn:"root"})
export class ManoObraDataService {
  private readonly block = inject(BlockHttpService);
  private readonly http = inject(HttpClient);

  // Data general
  public readonly dataset = signal<ManoObraData[]>([]);

  // Datos de los indicadores
  public readonly total_ordenes = signal(0);
  public readonly efectivas = signal(0);
  public readonly fallidas_pago = signal(0);
  public readonly sin_recaudacion = signal(0);
  public readonly recaudacion = signal(0);

  // Datos para los filtros
  public readonly proyectos = signal<FilterItem[]>([]);
  public readonly periodos = signal<FilterItem[]>([]);
  public readonly brigadas = signal<FilterItem[]>([]);
  public readonly tecnicos = signal<FilterItem[]>([]);

  public readonly actividad = signal<FilterItem[]>([
    {label:"Suspensión", value: "1"},
    {label:"Reconexión", value: "2"}
  ]);

  // Datos seleccionados en los filtros
  public readonly form_filters = new FormGroup({
    proyectos: new FormControl<string[]>([]),
    periodos: new FormControl<string[]>([]),
    brigadas: new FormControl<string[]>([]),
    tecnicos: new FormControl<string[]>([]),
    actividad: new FormControl<string[]>([])
  });

  constructor () {
    this.form_filters.controls.proyectos.valueChanges.subscribe(() => {
      const proyectos = this.form_filters.controls.proyectos.value ?? [];

      this.form_filters.controls.periodos.reset();
      this.form_filters.controls.brigadas.reset();
      this.form_filters.controls.tecnicos.reset();
      this.form_filters.controls.actividad.reset();

      if (proyectos.length == 0) {
        this.periodos.set([]);
        this.brigadas.set([]);
        this.tecnicos.set([]);
      }

      if (proyectos.length > 0) {
        const dataset = this.dataset();
        const actividad = this.actividad();

        const periodos = Array.from(
          new Set(
            dataset.filter(it =>
              proyectos.includes(it.zona)
            ).map(it => it.fecha)
          )
        ).map<FilterItem>(it => ({label:it, value:it}))

        this.periodos.set(periodos);
        this.form_filters.controls.actividad.setValue(actividad.map(it => it.value));
      }

      this.load_dataset();
    });

    this.form_filters.controls.periodos.valueChanges.subscribe(() => {
      const proyectos = this.form_filters.controls.proyectos.value ?? [];
      const periodos = this.form_filters.controls.periodos.value ?? [];

      this.form_filters.controls.brigadas.reset();
      this.form_filters.controls.tecnicos.reset();

      if (periodos.length == 0) {
        this.brigadas.set([]);
        this.tecnicos.set([]);
      }

      if (periodos.length > 0) {
        const dataset = this.dataset();

        const brigadas = Array.from(
          new Set(
            dataset.filter(it =>
              proyectos.includes(it.zona) &&
              periodos.includes(it.fecha)
            ).map(it => it.tipo_brigada)
          )
        ).map<FilterItem>(it => ({label:it, value:it}));

        this.brigadas.set(brigadas);
      }

      this.load_dataset();
    });

    this.form_filters.controls.brigadas.valueChanges.subscribe(() => {
      const proyectos = this.form_filters.controls.proyectos.value ?? [];
      const periodos = this.form_filters.controls.periodos.value ?? [];
      const brigadas = this.form_filters.controls.brigadas.value ?? [];

      this.form_filters.controls.tecnicos.reset();

      if (brigadas.length == 0) {
        this.tecnicos.set([]);
      }

      if (brigadas.length > 0) {
        const data = this.dataset();

        const tecnicos = Array.from(
          new Set(
            data.filter(it =>
              proyectos.includes(it.zona) &&
              periodos.includes(it.fecha) &&
              brigadas.includes(it.tipo_brigada)
            ).map(it => it.tecnico)
          )
        ).map<FilterItem>(it => ({label:it, value:it}))

        this.tecnicos.set(tecnicos);
      }

      this.load_dataset();
    });

    this.form_filters.controls.tecnicos.valueChanges.subscribe(() => {
      this.load_dataset();
    });

    this.form_filters.controls.actividad.valueChanges.subscribe(() => {
      this.load_dataset();
    });
  }

  private load_dataset() {
    const proyectos = this.form_filters.controls.proyectos.value ?? [];
    const periodos = this.form_filters.controls.periodos.value ?? [];
    const brigadas = this.form_filters.controls.brigadas.value ?? [];
    const tecnicos = this.form_filters.controls.tecnicos.value ?? [];
    const actividad = this.form_filters.controls.actividad.value ?? [];

    const dataset = this.dataset();

    const result = dataset.filter(
      it => proyectos.includes(it.zona)
      && (
        actividad.length == 1 ?
        actividad.includes("2")?
        it.tipo_os == "TO502" :
        it.tipo_os != "TO502" :
        !(actividad.length == 0)
      )
      && (
          periodos.length > 0 ?
          periodos.includes(it.fecha) :
          true
        )
      && (
          brigadas.length > 0 ?
          brigadas.includes(it.tipo_brigada) :
          true
        )
      && (
        tecnicos.length > 0 ?
        tecnicos.includes(it.tecnico) :
        true
      )
    );

    this.total_ordenes.set(result.length);
  }

  public fetch_data() {
    this.block.enable();

    const data = {
      proyectos: this.form_filters.controls.proyectos.value,
      periodos: this.form_filters.controls.periodos.value,
      brigadas: this.form_filters.controls.brigadas.value,
      tecnicos: this.form_filters.controls.tecnicos.value
    }

    this.http.post<ManoObraData[]>("/api/v1/manobra", data).subscribe({
      next: (res) => {
        this.dataset.set(res);
        this.block.disable();

        // cargar datos del campo proyectos
        const zonas = Array.from(new Set(res.map(it => it.zona)));
        this.proyectos.set(zonas.map<FilterItem>(it => ({label: it, value: it })));
        this.form_filters.controls.proyectos.setValue(zonas);
      },
      error: (err) => {
        console.error(err);
        this.block.disable();
      }
    });
  }
}
