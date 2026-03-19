import { ProgressSpinnerModule } from "primeng/progressspinner";
import { BlockHttpService } from '@/services/block_http';
import { Component, inject } from '@angular/core';
import { BlockUIModule } from "primeng/blockui";
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-root',
    imports: [
      ProgressSpinnerModule,
      BlockUIModule,
      RouterModule,
    ],
    template: `
      <router-outlet></router-outlet>
      <p-block-ui [blocked]="block_status" class="flex justify-center items-center">
        @if (block_status == true) {
          <p-progress-spinner ariaLabel="loading"/>
        }
      </p-block-ui>
    `,
})
export class AppComponent {
  private readonly block = inject(BlockHttpService);

  protected get block_status() {
    return this.block.status();
  }
}
