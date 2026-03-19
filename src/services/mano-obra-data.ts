import { FilterItem, PeriodosData, ZonasData } from "@/config/typing";
import { inject, Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BlockHttpService } from "./block_http";
import { FormControl, FormGroup } from "@angular/forms";

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
  public readonly peridos = signal<PeriodosData[]>([]);
  public readonly zonas = signal<ZonasData[]>([]);
  public readonly brigadas = signal<FilterItem[]>([]);
  public readonly tecnicos = signal<FilterItem[]>([]);
  public readonly actividad = signal<FilterItem[]>([]);

  // Datos seleccionados en los filtros
  public readonly form_filters = new FormGroup({
    periodos: new FormControl<string[]>([], {nonNullable:true}),
    zonas: new FormControl<string[]>([], {nonNullable:true}),
    brigadas: new FormControl<string[]>([], {nonNullable:true}),
    tecnicos: new FormControl<string[]>([],{nonNullable:true}),
    actividad: new FormControl<string[]>([], {nonNullable:true})
  });

  private readonly data_mano_obra:any[] = [];

  public fetch_mano_obra() {
    this.block.enable();

    const request = this.http.get<any[]>("");
  }

  public fetch_periodos() {
    this.block.enable();

    this.http.get<PeriodosData[]>("/api/v1/manobra/periodos").subscribe({
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

  public fetch_zonas(periodos:string[]) {
    this.block.enable();

    this.http.get<any[]>("/api/v1/manobra/zonas", {
      params: { periodos }
    }).subscribe({
      next: (res) => {
        this.zonas.set(res);
        this.block.disable();
      },
      error: (err) => {
        console.error(err);
        this.block.disable();
      }
    });
  }

  public fetch_brigadas(peridos:string[], zonas:string[]) {
    this.block.enable();

    this.http.get<any[]>("/api/v1/manobra/brigadas", {
      params: { peridos, zonas }
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
