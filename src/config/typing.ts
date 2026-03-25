export type FilterItem = {
  label: string
  value: string
}

export type ManoObraData = {
  nic: string,
  orden: string,
  contrata: string,
  territorio: string,
  zona: string,
  municipio: string,
  corregimiento: string,
  localidad_barrio: string,
  tarifa: string,
  tipo_actividad: any,
  actividad: any,
  direccion: string,
  id_transformador: string,
  id_circuito: string,
  num_medidor: string,
  marca_medidor: any,
  deuda_act: number,
  deuda_cierre: number,
  cant_factura_act: number,
  cant_factura_cierre: number,
  tipo_os: string,
  descripcion_tipo_os: string,
  tipo_suspension_solicitada: string,
  tipo_brigada: string,
  id_tecnico: string,
  tecnico: string,
  av_resultado: string,
  accion: string,
  subaccion_subanomalia: string,
  estado_osf: string,
  estado_siprem: string,
  fecha: string,
  hora: string
}
