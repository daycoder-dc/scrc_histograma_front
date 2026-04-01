import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-footer',
  template: `
    <div class="layout-footer">
      <img src="/favicon.png" alt="ises" width="16">
      <span>{{bar_title}}</span>
      <span>&copy;</span>
      <Span>Todos los derechos reservados.</Span>
    </div>`
})
export class AppFooter {
  protected bar_title = "ISES S.A"
}
