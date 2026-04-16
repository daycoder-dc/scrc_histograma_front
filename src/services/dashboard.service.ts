import {
  DataIndicadores, DateUpdateData, EstadoOrdenes, FilterItem,
  HistoryData, RendimientoBrigadaDts
} from "@/config/typing";
import { inject, Injectable, signal } from "@angular/core";
import { ChartOptions, ChartData, Chart } from "chart.js";
import { FormControl, FormGroup } from "@angular/forms";
import chartDataLabels from "chartjs-plugin-datalabels";
import { HttpClient } from "@angular/common/http";
import { BlockHttpService } from "./block_http";
import { io } from "socket.io-client";
import { unpack } from "msgpackr";
import * as lf from "leaflet";

@Injectable({ providedIn: "root" })
export class DashboardService {
  private readonly block = inject(BlockHttpService);
  private readonly http = inject(HttpClient);

  public readonly socket = io({
    path: "/api/socket.io",
    transports: ["websocket"],
    autoConnect: true,
  });

  // Data general
  public readonly dataset = signal<HistoryData[]>([]);
  public readonly table = signal<HistoryData[]>([]);
  public readonly file_process = signal(false);
  private readonly total_ordenes = signal(0);

  public readonly indicadores = signal<DataIndicadores[]>([
    {
      value: 0,
      description: "Total ordenes",
      color: "text-white",
      background: true,
      porcentaje: 0,
      monto: 0,
    },
    {
      value: 0,
      description: "Efectivas",
      color: "text-primary",
      background: false,
      porcentaje: 0,
      monto: 0,
    },
    {
      value: 0,
      description: "Fallida C/Pago",
      color: "text-primary",
      background: false,
      porcentaje: 0,
      monto: 0,
    },
    {
      value: 0,
      description: "Sin recaudación",
      color: "text-red-500",
      background: false,
      porcentaje: 0,
      monto: 0,
    },
  ]);

  // Datos para los filtros
  public readonly proyectos = signal<FilterItem[]>([]);
  public readonly periodos = signal<FilterItem[]>([]);
  public readonly brigadas = signal<FilterItem[]>([]);
  public readonly tecnicos = signal<FilterItem[]>([]);
  public readonly afa = signal<string[]>([]);
  public readonly ed = signal<string[]>([]);

  public readonly actividad = signal<FilterItem[]>([
    { label: "Suspensión", value: "1" },
    { label: "Reconexión", value: "2" }
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
  public readonly fecha_acualizacion = signal("");
  public readonly distrubuion_horaria_valor = signal<ChartData | null>(null);
  public readonly evolucion_diaria = signal<ChartData | null>(null);
  public readonly rendimiento_brigada = signal<RendimientoBrigadaDts[]>([]);
  public readonly analisis_fallidas_accion = signal<ChartData | null>(null);

  // Configuracion de las opciones de los graficos chart.js
  public readonly options_distribucion_horaria: ChartOptions<"line"> = {
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
        title: { display: true, text: "Recaudación ($)" }
      }
    }
  }

  public readonly options_evolucion_diaria: ChartOptions<"bar"> = {
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
      title: { display: true, text: "Evolución Diaria (Clic para filtrar)" },
      tooltip: { mode: "index", intersect: false },
      datalabels: {
        align: "center",
        clip: false,
        font: { size: 10 },
        formatter: (value, ctx) => {
          if (value === 0) return null;

          const datasets = ctx.chart.data.datasets;
          const dt1 = Number(datasets[0].data[ctx.dataIndex] || 0);
          const dt2 = Number(datasets[1].data[ctx.dataIndex] || 0);
          const dt3 = Number(datasets[2].data[ctx.dataIndex] || 0);
          const total = dt1 + dt2 + dt3;

          if (total === 0) return null;

          const percentage = Math.floor((value / total) * 100);

          if (percentage < 1) return null;

          return percentage + "%";
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        title: { display: true, text: "Día del Mes" }
      },
      y: {
        stacked: true,
        title: { display: true, text: "Cantidad" }
      }
    },
    onClick: (event, elements, chart) => {
      const dia = chart.data?.labels![elements[0]?.index] as string | undefined;
      const data = this.ed();

      if (dia) {
        data.push(dia);
        this.ed.set(data);
        this.load_dataset();
      }
    }
  }

  public readonly options_analisis_fallidas_accion: ChartOptions<"bar"> = {
    indexAxis: "y",
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
      title: { display: true, text: "Análisis de Fallidas por Acción (Click par filtrar)" },
      datalabels: {
        align: "center",
        clip: false,
        font: { size: 10 },
        formatter: (value, ctx) => {
          if (value === 0) return null;

          const total = this.total_ordenes();

          if (total === 0) return null;

          const percentage = Math.floor((value / total) * 100);

          if (percentage === 0) return null;

          return percentage + "%";
        }
      },
      tooltip: {
        mode: "index",
        intersect: false
      }
    },
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        title: { display: true, text: "Cantidad de OS" },
      },
      y: {
        stacked: true,
        ticks: {
          autoSkip: false,
          callback: function (value) {
            const label = this.getLabelForValue(value as number);
            const max_lengthh = 24;

            if (label && label.length > max_lengthh) {
              return label.substring(0, max_lengthh) + ' ...';
            }

            return label;
          }
        }
      }
    },
    layout: {
      padding: { right: 50 }
    },
    onClick: (event, elements, chart) => {
      const categoria = chart.data?.labels![elements[0]?.index] as string | undefined;
      const data = this.afa();

      if (categoria) {
        data.push(categoria);
        this.afa.set(data);
        this.load_dataset();
      }
    }
  }

  // Configuracion del mapa
  private readonly map_canvas = lf.canvas({ padding: 0.5 });
  public readonly map_layers = new lf.LayerGroup();
  public map?: lf.Map;
  public readonly leaflet_options: lf.MapOptions = {
    layers: [
      lf.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 21,
        minZoom: 4
      })
    ],
    zoom: 12,
    center: lf.latLng(10.963, -74.796),
    renderer: this.map_canvas
  }

  constructor() {
    Chart.register(chartDataLabels);

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
            dataset.filter(it => proyectos.includes(it.zona)).map(
              it => it.periodo
            )
          )
        ).map<FilterItem>(it => ({ label: it, value: it }))

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
              periodos.includes(it.periodo)
            ).map(it => it.tipo_brigada)
          )
        )
          .map<FilterItem>(it => ({ label: it, value: it }));

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
              periodos.includes(it.periodo) &&
              brigadas.includes(it.tipo_brigada)
            ).map(it => it.tecnico)
          )
        )
          .filter(it => it != null)
          .map<FilterItem>(it => ({ label: it, value: it }))

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

  public load_dataset() {
    const proyectos = this.form_filters.controls.proyectos.value ?? [];
    const periodos = this.form_filters.controls.periodos.value ?? [];
    const brigadas = this.form_filters.controls.brigadas.value ?? [];
    const tecnicos = this.form_filters.controls.tecnicos.value ?? [];
    const actividad = this.form_filters.controls.actividad.value ?? [];
    const afa = this.afa();
    const ed = this.ed();

    const dataset = this.dataset();

    const result = dataset.filter(
      it => proyectos.includes(it.zona)
        && (
          actividad.length == 1 ?
            actividad.includes("2") ?
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
            (it.tecnico && tecnicos.includes(it.tecnico)) :
            true
        )
        && (
          afa.length > 0 ?
            afa.includes(it.accion) :
            true
        )
        && (
          ed.length > 0 ?
            ed.includes(it.periodo_dia) :
            true
        )
    );

    // Cargar indicadores
    {
      const ordenes = result.reduce<DataIndicadores>((acc, cur) => {
        acc.value += 1;
        acc.porcentaje = 100;
        acc.monto += cur.valor_unitario;
        return acc;
      }, {
        description: "Total ordenes",
        color: "text-white",
        background: true,
        value: 0,
        porcentaje: 0,
        monto: 0
      });

      const efectivas = result.filter(it => it.estado == EstadoOrdenes.EFECTIVA)
        .reduce<DataIndicadores>((acc, cur) => {
          acc.value += 1;
          acc.porcentaje = Math.round((acc.value / ordenes.value) * 100);
          acc.monto += cur.valor_unitario;
          return acc;
        }, {
          description: "Efectivas",
          color: "text-primary",
          background: false,
          value: 0,
          porcentaje: 0,
          monto: 0,
        }
        );

      const fallidas_paga = result.filter(it => it.estado == EstadoOrdenes.FALLIDA_PAGA)
        .reduce<DataIndicadores>((acc, cur) => {
          acc.value += 1;
          acc.porcentaje = Math.round((acc.value / ordenes.value) * 100);
          acc.monto += cur.valor_unitario;
          return acc;
        }, {
          description: "Fallida C/Pago",
          color: "text-primary",
          background: false,
          value: 0,
          porcentaje: 0,
          monto: 0,
        }
        );

      const sin_recaudacion = result.filter(it => it.estado == EstadoOrdenes.FALLIDA)
        .reduce<DataIndicadores>((acc, cur) => {
          acc.value += 1;
          acc.porcentaje = Math.round((acc.value / ordenes.value) * 100);
          acc.monto += cur.valor_unitario;
          return acc;
        }, {
          value: 0,
          description: "Sin recaudación",
          color: "text-red-500",
          background: false,
          porcentaje: 0,
          monto: 0,
        }
        );

      this.indicadores.set([ordenes, efectivas, fallidas_paga, sin_recaudacion]);
      this.total_ordenes.set(ordenes.value);
    }

    // Cargar grafico de distribución horaria y valor
    {
      type DataGraphic = {
        [k: string]: {
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

          if (cur.estado == EstadoOrdenes.FALLIDA_PAGA) {
            acc[cur.tiempo].fallidas_pagas += 1;
          }

          if (cur.estado == EstadoOrdenes.FALLIDA) {
            acc[cur.tiempo].fallidas += 1;
          }

          acc[cur.tiempo].ingreso += cur.valor_unitario;

          return acc;
        }, {})
      ).sort((a, b) => a[0].localeCompare(b[0]));

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

    // Cargar grafico Evolución Diaria
    {
      type DataGraphic = {
        [k: string]: {
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

          if (cur.estado == EstadoOrdenes.FALLIDA_PAGA) {
            acc[cur.periodo_dia].fallidas_pagas += 1;
          }

          if (cur.estado == EstadoOrdenes.FALLIDA) {
            acc[cur.periodo_dia].fallidas += 1;
          }

          return acc;
        }, {})
      ).sort((a, b) => a[0].localeCompare(b[0]));

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
        [k: string]: {
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

          if (cur.estado == EstadoOrdenes.FALLIDA_PAGA) {
            acc[cur.tipo_brigada].fallidas_pagas += 1;
          }

          if (cur.estado == EstadoOrdenes.FALLIDA) {
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
        .sort((a, b) => b.caja - a.caja);

      this.rendimiento_brigada.set(data);
    }

    // Cargar grafico Analisis de fallidas por acción
    {
      type DataGraphicV1 = {
        [k: string]: {
          fallidas: number,
          fallidas_paga: number,
          total: number
        }
      }

      type DataGraphicV2 = {
        label: string,
        fallidas: number,
        fallidas_paga: number,
        total: number
      }

      const data = Object.entries(
        result.reduce<DataGraphicV1>((acc, cur) => {
          if (cur.estado != EstadoOrdenes.EFECTIVA) {
            const accion = cur.accion.trim();

            if (acc[accion] === undefined) {
              acc[accion] = {
                fallidas: 0,
                fallidas_paga: 0,
                total: 0
              }
            }

            if (cur.estado == EstadoOrdenes.FALLIDA) {
              acc[accion].fallidas += 1;
            }

            if (cur.estado == EstadoOrdenes.FALLIDA_PAGA) {
              acc[accion].fallidas_paga += 1;
            }

            acc[accion].total += 1;
          }

          return acc;
        }, {})
      ).reduce<DataGraphicV2[]>((acc, cur) => {
        acc.push({
          label: cur[0],
          fallidas: cur[1].fallidas,
          fallidas_paga: cur[1].fallidas_paga,
          total: cur[1].total
        });

        return acc;
      }, [])
        .filter(it => it.total > 0)
        .sort((a, b) => b.total - a.total);

      const dataset: ChartData = {
        labels: data.map(it => it.label),
        datasets: [
          {
            label: "Fallidas (Sin Recaudación)",
            data: data.map(it => it.fallidas),
          },
          {
            label: "Fallidas Pagas (C/Recaudación)",
            data: data.map(it => it.fallidas_paga),
          }
        ]
      };

      this.analisis_fallidas_accion.set(dataset);
    }

    // Cargar marcadores map
    {
      this.map_layers.clearLayers();

      let count = 0;
      for (const item of result) {
        if (item.latitud && item.longitud) {
          const marker = lf.circleMarker([Number(item.latitud), Number(item.longitud)], {
            renderer: this.map_canvas,
            radius: 5,
            fillColor: "#ff4757",
            stroke: false,
            weight: 0.5,
            opacity: 1,
            fillOpacity: 0.8
          });

          this.map_layers.addLayer(marker);
          count++;
        }
      }

      console.log("Markers:", count);
    }

    this.table.set(result);
  }

  public fetch_data() {
    this.block.enable();

    this.http.get("/api/v1/history", { responseType: "arraybuffer" }).subscribe({
      next: (res) => {
        const data = unpack(new Uint8Array(res)) as HistoryData[];
        const zonas = Array.from(new Set(data.map(it => it.zona)));

        this.dataset.set(data);
        this.proyectos.set(zonas.map<FilterItem>(it => ({ label: it, value: it })));
        this.form_filters.controls.proyectos.setValue(zonas);
        this.block.disable();
      },
      error: (err) => {
        console.error(err);
        this.block.disable();
      }
    });

    this.http.get<DateUpdateData>("/api/v1/history/get%20update%20date").subscribe({
      next: (res) => {
        const result = res.fecha_registro;

        if (result) {
          this.fecha_acualizacion.set(result);
        }
      },
      error: (e) => {
        console.error(e);
      }
    });
  }
}
