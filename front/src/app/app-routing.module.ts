import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { NotfoundComponent } from './main/notfound/notfound.component';
import { AppLayoutComponent } from "./layout/app.layout.component";
import { AuthGuard } from './main/middleware/guards/auth.guard';

@NgModule({
    imports: [
        RouterModule.forRoot([
            {
                // Todas as telas dentro do layout exigem login (AuthGuard no pai e nos filhos) - [Otávio Michels]
                path: '', component: AppLayoutComponent,
                canActivate: [AuthGuard],
                canActivateChild: [AuthGuard],
                // Nesta parte o sistema tem só a tela de agendamentos; o endereço inicial já abre ela - [Otávio Michels]
                children: [
                    { path: '', pathMatch: 'full', redirectTo: 'agendamentos' },
                    { path: 'agendamentos', loadChildren: () => import('./main/agendamento/agendamento.module').then(m => m.AgendamentoModule) },
                    { path: 'servicos', loadChildren: () => import('./main/servico/servico.module').then(m => m.ServicoModule) },
                    { path: 'historico', loadChildren: () => import('./main/historico/historico.module').then(m => m.HistoricoModule) },
                    { path: 'usuarios', loadChildren: () => import('./main/usuario/usuario.module').then(m => m.UsuarioModule) },
                    { path: 'pets', loadChildren: () => import('./main/pet/pet.module').then(m => m.PetModule) },
                    { path: 'tutores', loadChildren: () => import('./main/tutor/tutor.module').then(m => m.TutorModule) },
                    { path: 'produtos', loadChildren: () => import('./main/produto/produto.module').then(m => m.ProdutoModule) }
                ]
            },
            { path: 'auth', loadChildren: () => import('./main/middleware/auth/auth.module').then(m => m.AuthModule) },
            { path: 'notfound', component: NotfoundComponent },
            { path: '**', redirectTo: '/notfound' },
        ], { scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled', onSameUrlNavigation: 'reload' })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
