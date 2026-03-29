import { EstadoOrdenes, FilterItem, ManoObraData, RendimientoBrigadaDts, TipoActividadesDts } from "@/config/typing";
import { computed, inject, Injectable, signal } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { BlockHttpService } from "./block_http";
import { io } from "socket.io-client";
import { ChartData} from "chart.js";

@Injectable({providedIn:"root"})
export class DashboardService {
  private readonly block = inject(BlockHttpService);
  private readonly http = inject(HttpClient);
  private readonly socket = io({
    path: "/api/socket.io",
    transports: ["websocket"],
    autoConnect: true,
  });

  // Data general
  public readonly dataset = signal<ManoObraData[]>([]);

  public readonly indicadores = computed(() => [
    {
      value: this.total_ordenes(),
      description: "Total ordenes",
      color: "text-white",
      background: true,
      modeda: false
    },
    {
      value: this.efectivas(),
      description: "Efectivas",
      color: "text-primary",
      background: false,
      modeda: false
    },
    {
      value: this.fallidas_pago(),
      description: "Fallida C/Pago",
      color: "text-primary",
      background: false,
      modeda: false
    },
    {
      value: this.sin_recaudacion(),
      description: "Sin recaudación",
      color: "text-red-500",
      background: false,
      modeda: false
    },
    {
      value: this.recaudacion(),
      description: "Recaudación",
      color: "text-green-500",
      background: false,
      modeda: true
    }
  ]);

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

  // Datos dashboard
  public readonly distrubuion_horaria_valor = signal<ChartData | null>(null);
  public readonly evolucion_diaria = signal<ChartData | null>(null);
  public readonly top_actividades = signal<TipoActividadesDts[]>([]);
  public readonly rendimiento_brigada = signal<RendimientoBrigadaDts[]>([]);

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
            ).map(it => it.periodo)
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

    this.socket.on("connected", (obj) => {
      console.log("Connected")
    })
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
          periodos.includes(it.periodo) :
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

    // Cargar indicadores
    {
      const total_ordenes = result.length;
      const efectivas = result.filter(it => it.estado == EstadoOrdenes.EFECTIVA).length;
      const fallidas = result.filter(it => it.estado == EstadoOrdenes.FALLIDA).length;
      const sin_recaudacion = result.filter(it => it.estado == EstadoOrdenes.PERDIDA).length;

      const recaudacion = result.filter(
        it => it.estado == EstadoOrdenes.EFECTIVA || it.estado == EstadoOrdenes.FALLIDA
      ).reduce((acc, cur) => acc + cur.valor_unitario , 0);

      this.total_ordenes.set(total_ordenes);
      this.efectivas.set(efectivas);
      this.fallidas_pago.set(fallidas);
      this.sin_recaudacion.set(sin_recaudacion);
      this.recaudacion.set(recaudacion);
    }

    // Cargar grafico de distribución horaria y valor
    {
      type DataGraphic = {
        [k:string]: {
          efectivas: number,
          fallidas_pagas: number,
          fallidas: number,
          ingreso: number
        }
      }

      const data = Object.entries(
        result.reduce<DataGraphic>((acc, cur) => {
          if (!acc[cur.tiempo]) {
            acc[cur.tiempo] = {
              efectivas: 0,
              fallidas_pagas: 0,
              fallidas: 0,
              ingreso: 0
            }
          }

          if (cur.estado == EstadoOrdenes.EFECTIVA) {
            acc[cur.tiempo].efectivas += 1;
          }

          if (cur.estado == EstadoOrdenes.FALLIDA) {
            acc[cur.tiempo].fallidas_pagas += 1;
          }

          if (cur.estado == EstadoOrdenes.PERDIDA) {
            acc[cur.tiempo].fallidas += 1;
          }

          acc[cur.tiempo].ingreso += cur.valor_unitario;

          return acc;
        }, {})
      ).sort((a,b) => a[0].localeCompare(b[0]));

      const dataset: ChartData = {
        labels: data.map(it => it[0]),
        datasets: [
          {
            type: "bar",
            label: "Efectivas",
            data: data.map(it => it[1].efectivas),
            yAxisID: "y"
          },
          {
            type: "bar",
            label: "Fallidas Paga",
            data: data.map(it => it[1].fallidas_pagas),
            yAxisID: "y"
          },
          {
            type: "bar",
            label: "Fallida",
            data: data.map(it => it[1].fallidas),
            yAxisID: "y"
          },
          {
            type: "line",
            label: "Ingreso ($)",
            tension: 0.4,
            data: data.map(it => it[1].ingreso),
            yAxisID: "y1"
          }
        ]
      }

      this.distrubuion_horaria_valor.set(dataset);
    }

    // Cargar tabla top actividades
    {
      type DataGraphic = {
        [k:string]: {
          os: number,
          ingreso: number,
        }
      }

      const data = Object.entries(
        result.reduce<DataGraphic>((acc, cur) => {
          if (cur.tipo_actividad) {
            if (!acc[cur.tipo_actividad]) {
              acc[cur.tipo_actividad] = {
                os: 0,
                ingreso: 0
              }
            }

            if (cur.estado == EstadoOrdenes.EFECTIVA || cur.estado == EstadoOrdenes.FALLIDA) {
              acc[cur.tipo_actividad].os += 1;
              acc[cur.tipo_actividad].ingreso += cur.valor_unitario;
            }
          }

          return acc;
        }, {})
      ).map<TipoActividadesDts>(it => ({
        actividad:it[0],
        os: it[1].os,
        ingreso: it[1].ingreso,
      }))
      .filter(it => it.ingreso > 0)
      .sort((a,b) => b.ingreso - a.ingreso)

      this.top_actividades.set(data);
    }

    // Cargar grafico Evolución Diaria
    {
      type DataGraphic = {
        [k:string]: {
          efectivas: number,
          fallidas_pagas: number,
          fallidas: number
        }
      }

      const data = Object.entries(
        result.reduce<DataGraphic>((acc, cur) => {
          if (!acc[cur.periodo_dia]) {
            acc[cur.periodo_dia] = {
              efectivas: 0,
              fallidas_pagas: 0,
              fallidas: 0
            }
          }

          if (cur.estado == EstadoOrdenes.EFECTIVA) {
            acc[cur.periodo_dia].efectivas += 1;
          }

          if (cur.estado == EstadoOrdenes.FALLIDA) {
            acc[cur.periodo_dia].fallidas_pagas += 1;
          }

          if (cur.estado == EstadoOrdenes.PERDIDA) {
            acc[cur.periodo_dia].fallidas += 1;
          }

          return acc;
        }, {})
      ).sort((a,b) => a[0].localeCompare(b[0]));

      const dataset: ChartData = {
        labels: data.map(it => it[0]),
        datasets: [
          {
            type: "bar",
            label: "Efectivas",
            data: data.map(it => it[1].efectivas)
          },
          {
            type: "bar",
            label: "Fallidas Paga",
            data: data.map(it => it[1].fallidas_pagas)
          },
          {
            type: "bar",
            label: "Fallida",
            data: data.map(it => it[1].fallidas)
          }
        ]
      }

      this.evolucion_diaria.set(dataset);
    }

    // Cargar Rendimiento de brigada
    {
      type DataGraphic = {
        [k:string]: {
          efectivas: number,
          fallidas_pagas: number,
          fallidas: number,
          caja: number
        }
      }

      const data = Object.entries(
        result.reduce<DataGraphic>((acc, cur) => {
          if (!acc[cur.tipo_brigada]) {
            acc[cur.tipo_brigada] = {
              efectivas: 0,
              fallidas_pagas: 0,
              fallidas: 0,
              caja: 0
            }
          }

          if (cur.estado == EstadoOrdenes.EFECTIVA) {
            acc[cur.tipo_brigada].efectivas += 1;
          }

          if (cur.estado == EstadoOrdenes.FALLIDA) {
            acc[cur.tipo_brigada].fallidas_pagas += 1;
          }

          if (cur.estado == EstadoOrdenes.PERDIDA) {
            acc[cur.tipo_brigada].fallidas += 1;
          }

          acc[cur.tipo_brigada].caja += cur.valor_unitario;

          return acc;
        }, {})
      ).map<RendimientoBrigadaDts>(it => ({
          brigada: it[0],
          efectivas: it[1].efectivas,
          fallidas_pago: it[1].fallidas_pagas,
          fallidas: it[1].fallidas,
          total: it[1].efectivas + it[1].fallidas_pagas + it[1].fallidas,
          caja: it[1].caja
        })
      )
      .filter(it => it.caja > 0)
      .sort((a,b) => b.caja - a.caja)

      this.rendimiento_brigada.set(data);
    }

    // Cargar grafico Analisis de fallidas por acción
    {
      type DataGraphic = {
        [k:string]: {

        }
      }
    }
  }

  public fetch_data() {
    this.block.enable();

    const data = {
      proyectos: this.form_filters.controls.proyectos.value,
      periodos: this.form_filters.controls.periodos.value,
      brigadas: this.form_filters.controls.brigadas.value,
      tecnicos: this.form_filters.controls.tecnicos.value
    }

    this.http.post<ManoObraData[]>("/api/v1/history", data).subscribe({
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
