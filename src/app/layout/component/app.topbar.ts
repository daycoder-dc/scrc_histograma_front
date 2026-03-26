import { DashboardUploadFile } from '@/app/pages/dashboard/upload_file/upload_file';
import { LayoutService } from '@/app/layout/service/layout.service';
import { Component, inject, signal } from '@angular/core';
import { StyleClassModule } from 'primeng/styleclass';
import { RouterModule } from '@angular/router';
import { TooltipModule } from "primeng/tooltip";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-topbar',
  imports: [
    DashboardUploadFile,
    StyleClassModule,
    TooltipModule,
    RouterModule,
    CommonModule
  ],
  template: `
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/">
              <!-- logo -->
               <div class="flex flex-col">
                  <span class="text-xl">{{ bar_title }}</span>
                  <span class="text-xs">Zona Norte, Centro, Sur</span>
               </div>
            </a>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()" pTooltip="Cambiar tema" tooltipPosition="left">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <!-- Botón de cargue de base de datos -->
                    <button type="button" class="layout-topbar-action" pTooltip="Cargar archivo excel" tooltipPosition="left" (click)="upload_file()">
                        <i class="pi pi-file-arrow-up"></i>
                        <span>Cargar DB</span>
                    </button>

                    <!-- Botón de perfil  -->
                    <button type="button" class="layout-topbar-action" pTooltip="Mi perfil" tooltipPosition="left">
                        <i class="pi pi-user"></i>
                        <span>Mi perfil</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <app-dashboard-upload-file [(visible)]="upload_file_visile" />
  `
})
export class AppTopbar {
  protected readonly bar_title = "SCR Dashboard";
  protected readonly layoutService = inject(LayoutService);
  protected upload_file_visile = signal(false);

  protected toggleDarkMode() {
    this.layoutService.layoutConfig.update((state) => ({
      ...state,
      darkTheme: !state.darkTheme
    }));
  }

  protected upload_file() {
    this.upload_file_visile.update(value => !value);
  }
}
