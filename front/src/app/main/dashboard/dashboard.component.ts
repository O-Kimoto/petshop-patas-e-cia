import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DashboardService, ResumoDashboard } from './dashboard.service';
import { LayoutService } from '../../layout/service/app.layout.service';
import { AuthService } from '../middleware/auth/auth.service';
import { mensagemDeErro } from '../shared/crud.service';

// Cores do gráfico por status, as mesmas das etiquetas da tela de agendamentos - [Otávio Michels]
const COR_STATUS: Record<string, string> = {
    'Agendado': '#3B82F6',
    'Confirmado': '#F59E0B',
    'Concluído': '#22C55E',
    'Cancelado': '#EF4444'
};

@Component({
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {

    resumo?: ResumoDashboard;
    carregando = true;
    nomeUsuario = '';
    hoje = new Date();

    graficoDados: any;
    graficoOpcoes: any;

    private sub: Subscription;

    constructor(
        private dashboardService: DashboardService,
        private messageService: MessageService,
        private layoutService: LayoutService,
        authService: AuthService
    ) {
        this.nomeUsuario = authService.getUsuario()?.nome || '';
        // Redesenha o gráfico quando o usuário troca entre tema claro e escuro - [Otávio Michels]
        this.sub = this.layoutService.configUpdate$.subscribe(() => this.montarGrafico());
    }

    ngOnInit() {
        this.carregar();
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

    async carregar() {
        this.carregando = true;
        try {
            this.resumo = await this.dashboardService.resumo();
            this.montarGrafico();
        } catch (err) {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: mensagemDeErro(err) });
        } finally {
            this.carregando = false;
        }
    }

    // Gráfico de rosca com a quantidade de agendamentos em cada status - [Otávio Michels]
    montarGrafico() {
        if (!this.resumo) return;
        const corTexto = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
        this.graficoDados = {
            labels: this.resumo.porStatus.map(s => s.status),
            datasets: [{
                data: this.resumo.porStatus.map(s => s.total),
                backgroundColor: this.resumo.porStatus.map(s => COR_STATUS[s.status] || '#94A3B8')
            }]
        };
        this.graficoOpcoes = {
            plugins: { legend: { position: 'bottom', labels: { color: corTexto, usePointStyle: true } } },
            cutout: '60%'
        };
    }

    get saudacao(): string {
        const hora = new Date().getHours();
        if (hora < 5) return 'Boa noite';
        if (hora < 12) return 'Bom dia';
        if (hora < 18) return 'Boa tarde';
        return 'Boa noite';
    }
}
