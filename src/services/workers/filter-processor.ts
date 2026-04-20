import { HistoryData, DataIndicadores, EstadoOrdenes, RendimientoBrigadaDts, } from "@/config/typing";
import { ChartData } from "chart.js";

addEventListener("message", ({ data }) => {
  const dataset = data.dataset as HistoryData[];
  const proyectos = data.proyectos as string[];
  const periodos = data.periodos as string[];
  const brigadas = data.brigadas as string[];
  const tecnicos = data.tecnicos as string[];
  const actividad = data.actividad as string[];
  const afa = data.afa as string[];
  const ed = data.ed as string[];
  const indicadores = data.indicadores as DataIndicadores[];
  const tw_colors = data.colors as any;

  let total_ordenes = 0;
  let distribucion_horaria: ChartData | null = null;
  let rendimiento_brigada: RendimientoBrigadaDts[] = [];
  let evolucion_diaria: ChartData | null = null;
  let analisis_fallidas_accion: ChartData | null = null;
  let brigada_liviana: ChartData | null = null;
  let brigada_pesada: ChartData | null = null;

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

  // Indicadores
  {
    indicadores.forEach(it => {
      it.monto = 0;
      it.porcentaje = 0;
      it.value = 0;
    });

    result.map(data => {
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
  }

  // Distribución horaria
  {
    type DataGraphic = {
      [k: string]: {
        efectivas: number,
        fallidas_pagas: number,
        fallidas: number,
        ingreso: number
      }
    }

    const result1 = Object.entries(
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

    distribucion_horaria = {
      labels: result1.map(it => it[0]),
      datasets: [
        {
          type: "bar",
          label: "Efectivas",
          data: result1.map(it => it[1].efectivas),
          yAxisID: "y",
          backgroundColor: tw_colors.blue,
          borderColor: tw_colors.blue
        },
        {
          type: "bar",
          label: "Fallidas Paga",
          data: result1.map(it => it[1].fallidas_pagas),
          yAxisID: "y",
          backgroundColor: tw_colors.yellow,
          borderColor: tw_colors.yellow
        },
        {
          type: "bar",
          label: "Fallida",
          data: result1.map(it => it[1].fallidas),
          yAxisID: "y",
          backgroundColor: tw_colors.red,
          borderColor: tw_colors.red
        },
        {
          type: "line",
          label: "Ingreso ($)",
          tension: 0.4,
          data: result1.map(it => it[1].ingreso),
          yAxisID: "y1"
        }
      ]
    }
  }

  // rendimiento brigada
  {
    type DataGraphic = {
      [k: string]: {
        efectivas: number,
        fallidas_pagas: number,
        fallidas: number,
        caja: number
      }
    }

    rendimiento_brigada = Object.entries(
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
    ).filter(
      it => it.caja > 0
    ).sort(
      (a, b) => b.caja - a.caja
    );
  }

  // Evolución diaria
  {
    type DataGraphic = {
      [k: string]: {
        efectivas: number,
        fallidas_pagas: number,
        fallidas: number
      }
    }

    const result1 = Object.entries(
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
    ).sort(
      (a, b) => a[0].localeCompare(b[0])
    );

    evolucion_diaria = {
      labels: result1.map(it => it[0]),
      datasets: [
        {
          type: "bar",
          label: "Efectivas",
          data: result1.map(it => it[1].efectivas),
          backgroundColor: tw_colors.blue,
          borderColor: tw_colors.blue,
        },
        {
          type: "bar",
          label: "Fallidas Paga",
          data: result1.map(it => it[1].fallidas_pagas),
          backgroundColor: tw_colors.yellow,
          borderColor: tw_colors.yellow
        },
        {
          type: "bar",
          label: "Fallida",
          data: result1.map(it => it[1].fallidas),
          backgroundColor: tw_colors.red,
          borderColor: tw_colors.red
        }
      ]
    }
  }

  // analisis fallidas accion
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

    const result1 = Object.entries(
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
    }, []
    ).filter(
      it => it.total > 0
    ).sort(
      (a, b) => b.total - a.total
    );

    analisis_fallidas_accion = {
      labels: result1.map(it => it.label),
      datasets: [
        {
          label: "Fallidas (Sin Recaudación)",
          data: result1.map(it => it.fallidas),
          backgroundColor: tw_colors.red,
          borderColor: tw_colors.red
        },
        {
          label: "Fallidas Pagas (C/Recaudación)",
          data: result1.map(it => it.fallidas_paga),
          backgroundColor: tw_colors.yellow,
          borderColor: tw_colors.yellow
        }
      ]
    }
  }

  // brigadas scr liviana
  {
    const result_total = (brigada: string): ChartData => {
      const result1 = dataset.filter(
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

      const result2 = Object.entries(
        result1.reduce<DataGraphic>((acc, cur) => {
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
      ).sort(
        (a, b) => b[1].efectivas - a[1].efectivas
      );

      return {
        labels: result2.map(it => it[0]),
        datasets: [
          {
            type: "bar",
            label: "Efectivas",
            data: result2.map(it => it[1].efectivas),
            backgroundColor: tw_colors.blue,
            borderColor: tw_colors.blue
          },
          {
            type: "bar",
            label: "Fallidas Paga",
            data: result2.map(it => it[1].fallidas_pagas),
            backgroundColor: tw_colors.yellow,
            borderColor: tw_colors.yellow,
          }
        ]
      }
    }

    brigada_liviana = result_total("SCR LIVIANA");
    brigada_pesada = result_total("SCR PESADA");
  }

  postMessage({
    result,
    indicadores,
    total_ordenes,
    distribucion_horaria,
    rendimiento_brigada,
    evolucion_diaria,
    analisis_fallidas_accion,
    brigada_liviana,
    brigada_pesada
  });
});
