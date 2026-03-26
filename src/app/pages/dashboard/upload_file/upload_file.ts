import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { Component, model } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: "app-dashboard-upload-file",
  templateUrl: "./upload_file.html",
  imports: [
    FileUploadModule,
    InputTextModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    SelectModule,
  ],
  providers: [
    MessageService
  ]
})
export class DashboardUploadFile {
  public readonly visible = model.required<boolean>();
  protected readonly uploadedFiles: any[] = [];

  constructor(private messageService: MessageService) {}

  protected readonly zona_items = [
    {label: "Norte", value: "norte"},
    {label: "Centro", value: "centro"},
    {label: "Sur", value: "sur"}
  ];

  onUpload(event: any) {
      for (const file of event.files) {
          this.uploadedFiles.push(file);
      }

      this.messageService.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded' });
  }
}
