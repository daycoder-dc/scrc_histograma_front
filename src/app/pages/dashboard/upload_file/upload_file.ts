import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FileUploadHandlerEvent, FileUploadModule } from 'primeng/fileupload';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { Component, effect, inject, model } from '@angular/core';
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
    FileUploadModule,
    InputTextModule,
    MessageModule,
    DialogModule,
    ButtonModule,
    SelectModule,
    ToastModule,
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
      if (this.visible() == false) {
        this.form.reset();
      }
    });
  }

  protected on_upload(event:FileUploadHandlerEvent) {
    this.form.controls.file.setValue(event.files[0]);
  }

  protected on_send_file(event:Event) {
    const controls = [
      this.form.controls.zona,
      this.form.controls.file
    ];

    controls.forEach(it => {
      if (it.invalid) it.markAsTouched();
    })

    if (controls.some(it => it.invalid == true)) {
      return;
    }

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
        this.alert.add({ severity: 'info', summary: 'Success', detail: 'Cargando archivo' });
        this.visible.set(false);
      }
    });
  }

  protected is_invalid(control_name:string) {
    const control = this.form.get(control_name);
    return control && control.touched && control.hasError("required");
  }
}
