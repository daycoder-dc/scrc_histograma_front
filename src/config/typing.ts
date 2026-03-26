export type FilterItem = {
  label: string
  value: string
}

export type TipoActividadesDts = {
  actividad: string,
  os: number,
  ingreso: number
}

export type RendimientoBrigadaDts = {
  brigada: string,
  efectivas: number,
  fallidas_pago: number,
  fallidas: number,
  total: number,
  caja: number
}

export type ManoObraData = {
  nic: string,
  orden: string,
  zona: string,
  tipo_brigada: string,
  tipo_os: string,
  tecnico: string,
  periodo: string,
  fecha: string,
  hora: string,
  tiempo: string,
  estado: string,
  valor_unitario: number,
  tipo_actividad: string,
  periodo_dia: string
}

export enum EstadoOrdenes {
  EFECTIVA = "Efectiva",
  FALLIDA = "Fallida",
  PERDIDA = "Perdida"
}
