import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { TutorComponent } from './tutor.component';

// Tela de tutores em /tutores - [Otávio Michels]
@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild([{ path: '', component: TutorComponent }])
    ],
    declarations: [TutorComponent]
})
export class TutorModule { }
