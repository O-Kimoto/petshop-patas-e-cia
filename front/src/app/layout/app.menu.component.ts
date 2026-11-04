import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { LayoutService } from './service/app.layout.service';
import { environment } from '../../environments/environment';

@Component({
    selector: 'app-menu',
    templateUrl: './app.menu.component.html'
})
export class AppMenuComponent implements OnInit {

    model: any[] = [];

    constructor(public layoutService: LayoutService) { }

    // Menu lateral do petshop, agrupado por assunto - [Otávio Michels]
    // Itens sem routerLink ainda não têm tela: ficam no layout, mas sem link
    ngOnInit() {
        this.model = [
            {
                label: 'Início',
                items: [
                    { label: 'Painel', icon: 'pi pi-fw pi-home' }
                ]
            },
            {
                label: 'Atendimento',
                items: [
                    { label: 'Agendamentos', icon: 'pi pi-fw pi-calendar', routerLink: ['/agendamentos'] },
                    { label: 'Histórico', icon: 'pi pi-fw pi-history', routerLink: ['/historico'] }
                ]
            },
            {
                label: 'Cadastros',
                items: [
                    { label: 'Tutores', icon: 'pi pi-fw pi-users' },
                    { label: 'Pets', icon: 'pi pi-fw pi-heart', routerLink: ['/pets'] }
                ]
            },
            {
                label: 'Catálogo',
                items: [
                    { label: 'Serviços', icon: 'pi pi-fw pi-star', routerLink: ['/servicos'] },
                    { label: 'Produtos', icon: 'pi pi-fw pi-shopping-bag' }
                ]
            },
            {
                label: 'Sistema',
                items: [
                    { label: 'Usuários', icon: 'pi pi-fw pi-user-edit', routerLink: ['/usuarios'] },
                    // Abre o Swagger numa aba nova (em produção o caminho é relativo: /api-docs)
                    { label: 'Documentação da API', icon: 'pi pi-fw pi-book', url: environment.docsUrl, target: '_blank' }
                ]
            }
        ];
    }
}
