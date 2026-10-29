import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { PetComponent } from './pet.component';

// Tela de pets em /pets - [Otávio Michels]
@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild([{ path: '', component: PetComponent }])
    ],
    declarations: [PetComponent]
})
export class PetModule { }
