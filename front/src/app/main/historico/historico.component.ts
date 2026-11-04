import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Agendamento, StatusAgendamento } from '../agendamento/models/agendamento';
import { AgendamentoService } from '../agendamento/services/agendamento.service';
import { Tutor } from '../tutor/models/tutor';
import { TutorService } from '../tutor/services/tutor.service';
import { Pet } from '../pet/models/pet';
import { PetService } from '../pet/services/pet.service';
import { mensagemDeErro } from '../shared/crud.service';
import { dataHoraParaApi } from '../shared/formatos';

// Números do quadro de resumo no topo da tela
interface Resumo {
    total: number;
    concluidos: number;
    cancelados: number;
    totalGasto: number;
    ultimo?: Agendamento;
    proximo?: Agendamento;
}

@Component({
    templateUrl: './historico.component.html'
})
export class HistoricoComponent implements OnInit {

    tutores: Tutor[] = [];
    petsDoTutor: Pet[] = [];
    tutorId: number | null = null;
    // null = todos os pets do tutor
    petId: number | null = null;

    atendimentos: Agendamento[] = [];
    resumo: Resumo = { total: 0, concluidos: 0, cancelados: 0, totalGasto: 0 };

    carregando = false;
    carregandoPets = false;

    colunasCsv = [
        { field: 'data_hora', header: 'Data/Hora' },
        { field: 'pet_nome', header: 'Pet' },
        { field: 'servico_nome', header: 'Serviço' },
        { field: 'valor', header: 'Valor' },
        { field: 'status', header: 'Status' },
        { field: 'observacoes', header: 'Observações' }
    ];

    constructor(
        private agendamentoService: AgendamentoService,
        private tutorService: TutorService,
        private petService: PetService,
        private messageService: MessageService,
        private route: ActivatedRoute
    ) { }

    async ngOnInit() {
        try {
            this.tutores = await this.tutorService.listar();
        } catch (err) {
            this.erro(err);
            return;
        }
        // Vindo do atalho da tela de agendamentos: /historico?tutor=1&pet=2 já abre filtrado
        const params = this.route.snapshot.queryParamMap;
        const tutor = Number(params.get('tutor'));
        const pet = Number(params.get('pet'));
        if (tutor && this.tutores.some(t => t.id === tutor)) {
            this.tutorId = tutor;
            await this.carregarPets();
            this.petId = this.petsDoTutor.some(p => p.id === pet) ? pet : null;
            await this.carregar();
        }
    }

    // Trocar o tutor zera o pet escolhido e já mostra o histórico de todos os pets dele
    async aoMudarTutor() {
        this.petId = null;
        await this.carregarPets();
        await this.carregar();
    }

    async carregarPets() {
        this.petsDoTutor = [];
        if (!this.tutorId) return;
        this.carregandoPets = true;
        try {
            this.petsDoTutor = await this.petService.listarDoTutor(this.tutorId);
        } catch (err) {
            this.erro(err);
        } finally {
            this.carregandoPets = false;
        }
    }

    // Usa os filtros ?tutor= e ?pet= da API de agendamentos; o mais recente aparece primeiro
    async carregar() {
        if (!this.tutorId) {
            this.atendimentos = [];
            this.calcularResumo();
            return;
        }
        this.carregando = true;
        try {
            const lista = await this.agendamentoService.listar({ tutor: this.tutorId, pet: this.petId || '' });
            this.atendimentos = lista.sort((a, b) => (b.data_hora || '').localeCompare(a.data_hora || ''));
            this.calcularResumo();
        } catch (err) {
            this.erro(err);
        } finally {
            this.carregando = false;
        }
    }

    // Total gasto conta só os atendimentos concluídos; o próximo é o primeiro em aberto a partir de agora
    calcularResumo() {
        const agora = dataHoraParaApi(new Date());
        const concluidos = this.atendimentos.filter(a => a.status === 'Concluído');
        const emAberto = this.atendimentos
            .filter(a => (a.status === 'Agendado' || a.status === 'Confirmado') && (a.data_hora || '') >= agora)
            .sort((a, b) => (a.data_hora || '').localeCompare(b.data_hora || ''));

        this.resumo = {
            total: this.atendimentos.length,
            concluidos: concluidos.length,
            cancelados: this.atendimentos.filter(a => a.status === 'Cancelado').length,
            // valor = preço na época do agendamento, então reajustes não mudam o que já foi gasto
            totalGasto: concluidos.reduce((soma, a) => soma + (a.valor ?? a.servico_preco ?? 0), 0),
            ultimo: concluidos[0],
            proximo: emAberto[0]
        };
    }

    get tutorEscolhido(): Tutor | undefined {
        return this.tutores.find(t => t.id === this.tutorId);
    }

    // Mesmas cores de status da tela de agendamentos
    severidade(status?: StatusAgendamento): string {
        switch (status) {
            case 'Confirmado': return 'warning';
            case 'Concluído': return 'success';
            case 'Cancelado': return 'danger';
            default: return 'info';
        }
    }

    private erro(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: mensagemDeErro(err), life: 6000 });
    }
}
