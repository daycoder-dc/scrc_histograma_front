import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Component } from '@angular/core';

@Component({
    selector: 'app-notfound',
    imports: [RouterModule, ButtonModule],
    templateUrl: "./notfound.html"
})
export class Notfound {}
