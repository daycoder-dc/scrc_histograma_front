import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-footer',
  template: `
    <div class="layout-footer">
      <span>{{bar_title}}</span>
      <span>&copy;</span>
      <Span>Todos los derechos reservados.</Span>
    </div>`
})
export class AppFooter {
  protected bar_title = "ISES S.A"
}
