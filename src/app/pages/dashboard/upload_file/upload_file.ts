import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component, effect, inject, model, viewChild } from '@angular/core';
import { FileUpload, FileUploadHandlerEvent } from 'primeng/fileupload';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { BlockHttpService } from '@/services/block_http';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: "app-dashboard-upload-file",
  templateUrl: "./upload_file.html",
  imports: [
    ReactiveFormsModule,
    ConfirmDialogModule,
    InputTextModule,
    MessageModule,
    DialogModule,
    ButtonModule,
    SelectModule,
    ToastModule,
    FileUpload,
  ],
  providers: [
    ConfirmationService,
    MessageService,
  ]
})
export class DashboardUploadFile {
  public readonly visible = model.required<boolean>();

  private readonly dialog = inject(ConfirmationService);
  private readonly alert = inject(MessageService);
  private readonly http = inject(HttpClient);
  private readonly block = inject(BlockHttpService);

  protected readonly file_upload = viewChild(FileUpload)
  protected readonly form = new FormGroup({
    zona: new FormControl<string | null>(null, {validators: Validators.required}),
    file: new FormControl<File | null>(null,{ validators: Validators.required})
  });

  protected readonly zona_items = [
    {label: "Norte", value: "norte"},
    {label: "Centro", value: "centro"},
    {label: "Sur", value: "sur"}
  ];

  constructor() {
    effect(() => {
      const component = this.file_upload();

      if (this.visible() == false) {
        this.form.reset();
        component?.clear();
      }
    });
  }

  protected on_upload(event:FileUploadHandlerEvent) {
    this.form.controls.file.setValue(event.files[0]);
  }

  protected on_send_file(event:Event, fu:FileUpload) {
    Object.values(this.form.controls).forEach((control, _) => {
      if (control.invalid) control.markAsTouched();
    })

    if (Object.values(this.form.controls).some(it => it.invalid == true)) {
      return;
    }

    const data = new FormData();
    data.append("zona", this.form.controls.zona.value!);
    data.append("file", this.form.controls.file.value!);

    this.dialog.confirm({
      target: event.target as EventTarget,
      message: "¿Está seguro de cargar este archivo?",
      header: "Subir archivo",
      icon: "pi pi-info-circle",
      rejectButtonProps: {
        label: "No",
        severity: "secondary",
        outlined: true
      },
      acceptButtonProps: {
        label: "Sí",
        severity: "primary"
      },
      accept: () => {
        this.block.enable();

        this.http.post<Record<string,string>>("/api/v1/history/upload", data).subscribe({
          next: (res) => {
            this.block.disable();

            this.alert.add({
              severity: 'info',
              summary: 'Success',
              detail: 'El archivo está siendo procesado.'
            });

            this.visible.set(false);
            sessionStorage.setItem("archivo_id", res["id"]);
          },
          error: (e:HttpErrorResponse) => {
            let detail = "No se pudo cargar el archivo.";

            this.block.disable();

            if (e.error?.description == "FILE_ALREADY_UPLOADED") {
              detail = "Este archivo ya fue cargado."
            }

            this.alert.add({
              severity: 'error',
              summary: 'Error',
              detail: detail
            });

            console.error(e);
          }
        });
      }
    });
  }

  protected is_invalid(control_name:string) {
    const control = this.form.get(control_name);
    return control && control.touched && control.hasError("required");
  }
}
