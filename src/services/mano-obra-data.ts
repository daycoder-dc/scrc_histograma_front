import { BrigadasData, FilterItem, ManoObraFilters, PeriodosData, ProyectosData, TecnicosData } from "@/config/typing";
import { inject, Injectable, signal } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { BlockHttpService } from "./block_http";

@Injectable({providedIn:"root"})
export class ManoObraDataService {
  private readonly block = inject(BlockHttpService);
  private readonly http = inject(HttpClient);

  // Datos de los indicadores
  public readonly total_ordenes = signal(0);
  public readonly efectivas = signal(0);
  public readonly fallidas_pago = signal(0);
  public readonly sin_recaudacion = signal(0);
  public readonly recaudacion = signal(0);

  // Datos para los filtros
  public readonly proyectos = signal<ProyectosData[]>([]);
  public readonly peridos = signal<PeriodosData[]>([]);
  public readonly brigadas = signal<BrigadasData[]>([]);
  public readonly tecnicos = signal<TecnicosData[]>([]);

  public readonly actividad = signal<FilterItem[]>([
    {name:"Suspensión"},
    {name:"Reconexión"}
  ]);

  // Datos seleccionados en los filtros
  public readonly form_filters = new FormGroup({
    proyectos: new FormControl<string[]>([], {nonNullable:true}),
    periodos: new FormControl<string[]>([], {nonNullable:true}),
    brigadas: new FormControl<string[]>([], {nonNullable:true}),
    tecnicos: new FormControl<string[]>([],{nonNullable:true}),
    actividad: new FormControl<string[]>([], {nonNullable:true})
  });

  private readonly data_mano_obra:any[] = [];

  public fetch_proyectos() {
    this.block.enable();

    this.http.get<ProyectosData[]>("/api/v1/manobra/proyectos").subscribe({
      next: (res) => {
        this.fetch_mano_obra();
        this.proyectos.set(res);
        this.block.disable();
      },
      error: (err) => {
        console.error(err);
        this.block.disable();
      }
    });
  }

  public fetch_periodos(params:ManoObraFilters) {
    this.block.enable();

    this.http.get<PeriodosData[]>("/api/v1/manobra/periodos",{
      params: {
        proyectos: params.proyectos!
      }
    }).subscribe({
      next: (res) => {
        this.peridos.set(res);
        this.block.disable();
      },
      error: (err) => {
        console.error(err);
        this.block.disable();
      }
    })
  }

  public fetch_brigadas(params:ManoObraFilters) {
    this.block.enable();

    this.http.get<BrigadasData[]>("/api/v1/manobra/brigadas", {
      params: {
        proyectos:params.proyectos!,
        periodos:params.periodos!
      }
    }).subscribe({
      next: (res) => {
        this.brigadas.set(res);
        this.block.disable();
      },
      error: (err) => {
        console.error(err);
        this.block.disable();
      }
    });
  }

  public fetch_tecnicos(params:ManoObraFilters) {
    this.block.enable();

    this.http.get<TecnicosData[]>("/api/v1/manobra/tecnicos", {
      params: {
        proyectos: params.proyectos!,
        periodos: params.periodos!,
        brigadas: params.brigadas!
      }
    }).subscribe({
      next: (res) => {
        this.tecnicos.set(res);
        this.block.disable();
      },
      error: (err) => {
        console.error(err);
        this.block.disable();
      }
    });
  }

  public fetch_mano_obra(params?:ManoObraFilters) {
    this.block.enable();

    const proyectos = params?.proyectos ?? this.proyectos().map(it => it.proyecto);
    const periodos = params?.periodos ?? ['0'];
    const brigadas = params?.brigadas ?? ['0'];
    const tecnicos = params?.tecnicos ?? ['0'];

    this.http.patch<any[]>("/api/v1/manobra",{
        proyectos,periodos,brigadas,tecnicos
    }).subscribe({
      next: (res) => {
        console.log(res);
        this.block.disable();
      },
      error: (err) => {
        console.error(err);
        this.block.disable();
      }
    });
  }
}
