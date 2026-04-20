import { HistoryData, FilterItem } from "@/config/typing";
import { unpack } from "msgpackr";

addEventListener("message", async ({ data }) => {
  const { buffer } = data;
  const dataset = unpack(new Uint8Array(buffer)) as HistoryData[];

  const zonas = Array.from(new Set(dataset.map(it => it.zona)));
  const periodos = Array.from(new Set(dataset.map(it => it.periodo)));
  const proyecto_items = zonas.map<FilterItem>(it => ({ label: it, value: it }))
  const periodo_items = periodos.map<FilterItem>(it => ({ label: it, value: it }));

  postMessage({ zonas, periodos, proyecto_items, periodo_items, dataset });
});
