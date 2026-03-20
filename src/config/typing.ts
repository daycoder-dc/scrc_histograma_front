export type FilterItem = {
  name: string
}

export type ProyectosData = {
  proyecto:string
}

export type PeriodosData = {
  periodo:string
}

export type BrigadasData = {
  brigada:string
}

export type TecnicosData = {
  tecnico:string
}

export type ManoObraFilters = {
  proyectos?:string[],
  periodos?:string[],
  brigadas?:string[],
  tecnicos?:string[],
  actividad?:string[]
}
