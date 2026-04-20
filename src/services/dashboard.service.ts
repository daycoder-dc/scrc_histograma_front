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
import { DatePipe } from "@angular/common";
import { io } from "socket.io-client";
import { unpack } from "msgpackr";
import * as lf from "leaflet";

@Injectable({ providedIn: "root" })
export class DashboardService {
  private readonly block = inject(BlockHttpService);
  private readonly http = inject(HttpClient);
  protected readonly date = inject(DatePipe);
  private load_dataset_enable = false;

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
      color: "text-blue-400",
      background: false,
      porcentaje: 0,
      monto: 0,
    },
    {
      value: 0,
      description: "Fallida C/Pago",
      color: "text-yellow-400",
      background: false,
      porcentaje: 0,
      monto: 0,
    },
    {
      value: 0,
      description: "Sin recaudación",
      color: "text-red-400",
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
  public readonly brigada_liviana = signal<ChartData | null>(null);
  public readonly brigada_pesada = signal<ChartData | null>(null);

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
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
      title: { display: true, text: "Evolución Diaria (Clic para filtrar)" },
      tooltip: { mode: "index", intersect: false },
      datalabels: {
        align: "center",
        clip: false,
        font: { size: 10 },
        color: "#33",
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
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
      title: { display: true, text: "Análisis de Fallidas por Acción (Click par filtrar)" },
      tooltip: { mode: "index", intersect: false },
      datalabels: {
        align: "center",
        clip: false,
        font: { size: 10 },
        color: "#333",
        formatter: (value, ctx) => {
          if (value === 0) return null;

          const total = this.total_ordenes();

          if (total === 0) return null;

          const percentage = Math.floor((value / total) * 100);

          if (percentage === 0) return null;

          return percentage + "%";
        }
      },
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

  public readonly options_brigada_scr_liviana: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
      title: { display: true, text: "Brigada SCR liviana" },
      tooltip: { mode: "index", intersect: false },
      datalabels: {
        align: "center",
        clip: true,
        font: { size: 9, weight: "bold" },
        color: "#333",
        formatter: (value, ctx) => {
          const formatter = new Intl.NumberFormat("es-CO", {
            notation: "compact",
            compactDisplay: "short",
            maximumFractionDigits: 1
          });

          return formatter.format(value);
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        title: { display: true, text: "Tecnico" },
        ticks: {
          callback: function (value) {
            return new Intl.NumberFormat("es-CO", {
              notation: "compact",
              compactDisplay: "short"
            }).format(value as number)
          }
        }
      },
      y: {
        stacked: true,
        title: { display: true, text: "Cantidad" },
        ticks: {
          font: {
            size: 9,
            family: "Arial"
          },
          autoSkip: false
        }
      }
    }
  }

  public readonly options_brigada_scr_pesada: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
      title: { display: true, text: "Brigada SCR pesada" },
      tooltip: { mode: "index", intersect: false },
      datalabels: {
        align: "center",
        clip: true,
        font: { size: 9, weight: "bold" },
        color: "#333",
        formatter: (value, ctx) => {
          const formatter = new Intl.NumberFormat("es-CO", {
            notation: "compact",
            compactDisplay: "short",
            maximumFractionDigits: 1
          });

          return formatter.format(value);
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        title: { display: true, text: "Tecnico" },
        ticks: {
          callback: function (value) {
            return new Intl.NumberFormat("es-CO", {
              notation: "compact",
              compactDisplay: "short"
            }).format(value as number)
          }
        }
      },
      y: {
        stacked: true,
        title: { display: true, text: "Cantidad" },
        ticks: {
          font: {
            size: 9,
            family: "Arial"
          },
          autoSkip: false
        }
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
    if (this.load_dataset_enable === false) {
      return;
    }

    this.load_dataset_enable = false;

    // console.count(`load_dataset: ${this.load_dataset_enable}`);

    const proyectos = this.form_filters.controls.proyectos.value ?? [];
    const periodos = this.form_filters.controls.periodos.value ?? [];
    const brigadas = this.form_filters.controls.brigadas.value ?? [];
    const tecnicos = this.form_filters.controls.tecnicos.value ?? [];
    const actividad = this.form_filters.controls.actividad.value ?? [];
    const afa = this.afa();
    const ed = this.ed();

    const dataset = this.dataset();

    const result = dataset.filter(
      it => (
        (
          proyectos.includes(it.zona)
        ) &&
        (
          actividad.length == 1 ?
            actividad.includes("2") ?
              it.tipo_os == "TO502" :
              it.tipo_os != "TO502" :
            !(actividad.length == 0)
        ) &&
        (
          periodos.includes(it.periodo)
        ) &&
        (
          brigadas.length > 0 ?
            brigadas.includes(it.tipo_brigada) :
            true
        ) &&
        (
          tecnicos.length > 0 ?
            (it.tecnico && tecnicos.includes(it.tecnico)) :
            true
        ) &&
        (
          afa.length > 0 ?
            afa.includes(it.accion) :
            true
        ) &&
        (
          ed.length > 0 ?
            ed.includes(it.periodo_dia) :
            true
        )
      )
    );

    this.table.set(result);

    this.load_indicadores(result);
    this.load_distribucion_horaria(result);
    this.load_evolucion_diaria(result);
    this.load_rendimiento_brigada(result);
    this.load_analisis_fallidas_accion(result);
    this.load_brigada_scr(dataset, proyectos, periodos, actividad, "SCR LIVIANA");
    this.load_brigada_scr(dataset, proyectos, periodos, actividad, "SCR PESADA");
    this.load_map(result);

    this.load_dataset_enable = true;
  }

  async load_brigada_scr(dataset: HistoryData[], proyectos: string[], periodos: string[], actividad: string[], brigada: "SCR LIVIANA" | "SCR PESADA") {
    const load = new Promise<ChartData>((res) => {

      const result = dataset.filter(
        it => (
          (
            proyectos.includes(it.zona)
          ) &&
          (
            actividad.length == 1 ?
              actividad.includes("2") ?
                it.tipo_os == "TO502" :
                it.tipo_os != "TO502" :
              !(actividad.length == 0)
          ) &&
          (
            periodos.includes(it.periodo)
          ) &&
          (
            it.tipo_brigada == brigada
          )
        )
      );

      // Cargar grafico
      type DataGraphic = {
        [k: string]: {
          efectivas: number,
          fallidas_pagas: number
        }
      }

      const data = Object.entries(
        result.reduce<DataGraphic>((acc, cur) => {
          if (cur.tecnico) {
            if (!acc[cur.tecnico]) {
              acc[cur.tecnico] = {
                efectivas: 0,
                fallidas_pagas: 0
              }
            }

            if (cur.estado == EstadoOrdenes.EFECTIVA) {
              acc[cur.tecnico].efectivas += cur.valor_unitario;
            }

            if (cur.estado == EstadoOrdenes.FALLIDA_PAGA) {
              acc[cur.tecnico].fallidas_pagas += cur.valor_unitario;
            }
          }

          return acc;
        }, {})
      ).sort((a, b) => b[1].efectivas - a[1].efectivas)

      res({
        labels: data.map(it => it[0]),
        datasets: [
          {
            type: "bar",
            label: "Efectivas",
            data: data.map(it => it[1].efectivas),
            backgroundColor: this.tw_colors.blue,
            borderColor: this.tw_colors.blue
          },
          {
            type: "bar",
            label: "Fallidas Paga",
            data: data.map(it => it[1].fallidas_pagas),
            backgroundColor: this.tw_colors.yellow,
            borderColor: this.tw_colors.yellow,
          }
        ]
      });
    });

    load.then((data) => {
      if (brigada == "SCR LIVIANA") {
        this.brigada_liviana.set(data);
      }

      if (brigada == "SCR PESADA") {
        this.brigada_pesada.set(data);
      }
    });
  }

  async load_map(dataset: HistoryData[]) {
    const load = new Promise<boolean>((res) => {
      this.map_layers.clearLayers();

      for (const item of dataset) {
        if (item.latitud && item.longitud) {
          const marker = lf.circleMarker([Number(item.latitud), Number(item.longitud)], {
            renderer: this.map_canvas,
            radius: 5,
            fillColor: (
              item.estado == EstadoOrdenes.EFECTIVA ? this.tw_colors.blue :
                item.estado == EstadoOrdenes.FALLIDA_PAGA ? this.tw_colors.yellow :
                  item.estado == EstadoOrdenes.FALLIDA ? this.tw_colors.red : "#333"
            ),
            stroke: false,
            weight: 0.5,
            opacity: 1,
            fillOpacity: 0.8
          });

          marker.bindTooltip(() => `
            <div class="flex flex-col gap-1 text-xs">
              <span class="font-bold text-sm">${item.orden}</span>
              <span class="font-bold">Barrio: ${item.barrio}</span>
              <span class="font-bold">Fecha: ${this.date.transform(item.fecha, "yyyy-MM-dd")}</span>
              <span class="font-bold">Ténico: ${item.tecnico}</span>
            </div>
          `, { direction: "top", sticky: true });

          this.map_layers.addLayer(marker);
        }
      }

      res(true);
    });

    load.then();
  }

  async load_analisis_fallidas_accion(dataset: HistoryData[]) {
    const load = new Promise<ChartData>((res) => {
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
        dataset.reduce<DataGraphicV1>((acc, cur) => {
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
      )
        .reduce<DataGraphicV2[]>((acc, cur) => {
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

      res({
        labels: data.map(it => it.label),
        datasets: [
          {
            label: "Fallidas (Sin Recaudación)",
            data: data.map(it => it.fallidas),
            backgroundColor: this.tw_colors.red,
            borderColor: this.tw_colors.red
          },
          {
            label: "Fallidas Pagas (C/Recaudación)",
            data: data.map(it => it.fallidas_paga),
            backgroundColor: this.tw_colors.yellow,
            borderColor: this.tw_colors.yellow
          }
        ]
      });
    });

    load.then((data) => {
      this.analisis_fallidas_accion.set(data);
    });
  }

  async load_rendimiento_brigada(dataset: HistoryData[]) {
    const load = new Promise<RendimientoBrigadaDts[]>((res) => {
      type DataGraphic = {
        [k: string]: {
          efectivas: number,
          fallidas_pagas: number,
          fallidas: number,
          caja: number
        }
      }

      const data = Object.entries(
        dataset.reduce<DataGraphic>((acc, cur) => {
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
      )
        .map<RendimientoBrigadaDts>(it => ({
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

      res(data);
    });

    load.then((data) => {
      this.rendimiento_brigada.set(data);
    });
  }

  async load_evolucion_diaria(dataset: HistoryData[]) {
    const load = new Promise<ChartData>((res) => {
      type DataGraphic = {
        [k: string]: {
          efectivas: number,
          fallidas_pagas: number,
          fallidas: number
        }
      }

      const data = Object.entries(
        dataset.reduce<DataGraphic>((acc, cur) => {
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
      )
        .sort((a, b) => a[0].localeCompare(b[0]));

      res({
        labels: data.map(it => it[0]),
        datasets: [
          {
            type: "bar",
            label: "Efectivas",
            data: data.map(it => it[1].efectivas),
            backgroundColor: this.tw_colors.blue,
            borderColor: this.tw_colors.blue,
          },
          {
            type: "bar",
            label: "Fallidas Paga",
            data: data.map(it => it[1].fallidas_pagas),
            backgroundColor: this.tw_colors.yellow,
            borderColor: this.tw_colors.yellow
          },
          {
            type: "bar",
            label: "Fallida",
            data: data.map(it => it[1].fallidas),
            backgroundColor: this.tw_colors.red,
            borderColor: this.tw_colors.red
          }
        ]
      });
    });

    load.then((data) => {
      this.evolucion_diaria.set(data);
    });
  }

  async load_distribucion_horaria(dataset: HistoryData[]) {
    const load = new Promise<ChartData>((res) => {
      type DataGraphic = {
        [k: string]: {
          efectivas: number,
          fallidas_pagas: number,
          fallidas: number,
          ingreso: number
        }
      }

      const data = Object.entries(
        dataset.reduce<DataGraphic>((acc, cur) => {
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
      )
        .sort((a, b) => a[0].localeCompare(b[0]));

      res({
        labels: data.map(it => it[0]),
        datasets: [
          {
            type: "bar",
            label: "Efectivas",
            data: data.map(it => it[1].efectivas),
            yAxisID: "y",
            backgroundColor: this.tw_colors.blue,
            borderColor: this.tw_colors.blue
          },
          {
            type: "bar",
            label: "Fallidas Paga",
            data: data.map(it => it[1].fallidas_pagas),
            yAxisID: "y",
            backgroundColor: this.tw_colors.yellow,
            borderColor: this.tw_colors.yellow
          },
          {
            type: "bar",
            label: "Fallida",
            data: data.map(it => it[1].fallidas),
            yAxisID: "y",
            backgroundColor: this.tw_colors.red,
            borderColor: this.tw_colors.red
          },
          {
            type: "line",
            label: "Ingreso ($)",
            tension: 0.4,
            data: data.map(it => it[1].ingreso),
            yAxisID: "y1"
          }
        ]
      });
    });

    load.then((data) => {
      this.distrubuion_horaria_valor.set(data);
    });
  }

  async load_indicadores(dataset: HistoryData[]) {
    const load = new Promise<any>((res) => {
      const indicadores = this.indicadores();
      let total_ordenes = 0;

      indicadores.forEach(it => {
        it.monto = 0;
        it.porcentaje = 0;
        it.value = 0;
      });

      dataset.map(data => {
        indicadores.forEach(indicador => {
          if (indicador.description == "Total ordenes") {
            indicador.value += 1;
            indicador.porcentaje = 100;
            indicador.monto += data.valor_unitario;
            total_ordenes = indicador.value;
          }

          switch (data.estado) {
            case EstadoOrdenes.EFECTIVA:
              if (indicador.description == "Efectivas") {
                indicador.value += 1;
                indicador.monto += data.valor_unitario;

                if (total_ordenes > 0) {
                  indicador.porcentaje = Math.round((indicador.value / total_ordenes) * 100);
                }
              }
              break;
            case EstadoOrdenes.FALLIDA_PAGA:
              if (indicador.description == "Fallida C/Pago") {
                indicador.value += 1;
                indicador.monto += data.valor_unitario;

                if (total_ordenes > 0) {
                  indicador.porcentaje = Math.round((indicador.value / total_ordenes) * 100);
                }
              }
              break;
            case EstadoOrdenes.FALLIDA:
              if (indicador.description == "Sin recaudación") {
                indicador.value += 1;
                indicador.monto += data.valor_unitario;

                if (total_ordenes > 0) {
                  indicador.porcentaje = Math.round((indicador.value / total_ordenes) * 100);
                }
              }
              break;
          }
        });
      });

      res([indicadores, total_ordenes])
    });

    load.then(([indicadores, total]) => {
      this.indicadores.set(indicadores);
      this.total_ordenes.set(total);
    });
  }

  public fetch_data() {
    this.block.enable();

    this.http.get("/api/v1/history", { responseType: "arraybuffer" }).subscribe({
      next: (res) => {
        const data = unpack(new Uint8Array(res)) as HistoryData[];
        const zonas = Array.from(new Set(data.map(it => it.zona)));
        const periodos = Array.from(new Set(data.map(it => it.periodo)));

        this.dataset.set(data);
        this.proyectos.set(zonas.map<FilterItem>(it => ({ label: it, value: it })));
        this.periodos.set(periodos.map<FilterItem>(it => ({ label: it, value: it })));

        this.form_filters.controls.proyectos.setValue(zonas);
        this.form_filters.controls.periodos.setValue(periodos);
        this.load_dataset_enable = true;
        this.load_dataset();
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

  private get tw_colors() {
    const document_colors = getComputedStyle(document.documentElement);

    return {
      blue: document_colors.getPropertyValue("--color-blue-400"),
      yellow: document_colors.getPropertyValue("--color-yellow-400"),
      red: document_colors.getPropertyValue("--color-red-400"),
    }
  }
}
