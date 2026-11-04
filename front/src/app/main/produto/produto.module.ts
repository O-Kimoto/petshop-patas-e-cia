import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { ProdutoComponent } from './produto.component';

// Tela de produtos em /produtos - [Otávio Michels]
@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild([{ path: '', component: ProdutoComponent }])
    ],
    declarations: [ProdutoComponent]
})
export class ProdutoModule { }
