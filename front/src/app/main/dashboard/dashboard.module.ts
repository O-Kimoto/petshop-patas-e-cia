import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { SharedModule } from '../shared/shared.module';
import { DashboardComponent } from './dashboard.component';

// Painel inicial (rota vazia "/") - [Otávio Michels]
@NgModule({
    imports: [
        SharedModule,
        ChartModule,
        RouterModule.forChild([{ path: '', component: DashboardComponent }])
    ],
    declarations: [DashboardComponent]
})
export class DashboardModule { }
