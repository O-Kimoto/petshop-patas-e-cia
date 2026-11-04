import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { HistoricoComponent } from './historico.component';

// Tela de histórico de atendimentos em /historico
@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild([{ path: '', component: HistoricoComponent }])
    ],
    declarations: [HistoricoComponent]
})
export class HistoricoModule { }
