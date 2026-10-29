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
    ngOnInit() {
        this.model = [
            {
                label: 'Início',
                items: [
                    { label: 'Painel', icon: 'pi pi-fw pi-home', routerLink: ['/'] }
                ]
            },
            {
                label: 'Atendimento',
                items: [
                    { label: 'Agendamentos', icon: 'pi pi-fw pi-calendar', routerLink: ['/agendamentos'] }
                ]
            },
            {
                label: 'Cadastros',
                items: [
                    { label: 'Tutores', icon: 'pi pi-fw pi-users', routerLink: ['/tutores'] },
                    { label: 'Pets', icon: 'pi pi-fw pi-heart', routerLink: ['/pets'] }
                ]
            },
            {
                label: 'Catálogo',
                items: [
                    { label: 'Serviços', icon: 'pi pi-fw pi-star', routerLink: ['/servicos'] },
                    { label: 'Produtos', icon: 'pi pi-fw pi-shopping-bag', routerLink: ['/produtos'] }
                ]
            },
            {
                label: 'Sistema',
                items: [
                    { label: 'Usuários', icon: 'pi pi-fw pi-user-edit', routerLink: ['/usuarios'] },
                    { label: 'Documentação da API', icon: 'pi pi-fw pi-book', url: [environment.docsUrl], target: '_blank' }
                ]
            }
        ];
    }
}
