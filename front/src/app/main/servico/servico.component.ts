import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { Servico } from './models/servico';
import { ServicoService } from './services/servico.service';
import { mensagemDeErro } from '../shared/crud.service';

@Component({
    templateUrl: './servico.component.html'
})
export class ServicoComponent implements OnInit {

    servicos: Servico[] = [];
    servico: Servico = {};
    servicoDialog = false;
    submitted = false;
    carregando = false;
    salvando = false;

    colunasCsv = [
        { field: 'nome', header: 'Nome' },
        { field: 'descricao', header: 'Descrição' },
        { field: 'preco', header: 'Preço' }
    ];

    constructor(
        private servicoService: ServicoService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) { }

    ngOnInit() {
        this.carregar();
    }

    async carregar() {
        this.carregando = true;
        try {
            this.servicos = await this.servicoService.listar();
        } catch (err) {
            this.erro(err);
        } finally {
            this.carregando = false;
        }
    }

    abrirNovo() {
        this.servico = {};
        this.submitted = false;
        this.servicoDialog = true;
    }

    editar(servico: Servico) {
        this.servico = { ...servico };
        this.submitted = false;
        this.servicoDialog = true;
    }

    // Preço 0 é válido (serviço gratuito); só não pode ficar vazio - [Otávio Michels]
    async salvar() {
        this.submitted = true;
        if (!this.servico.nome?.trim() || this.servico.preco === null || this.servico.preco === undefined) return;

        this.salvando = true;
        try {
            const novo = !this.servico.id;
            await this.servicoService.salvar(this.servico);
            this.messageService.add({ severity: 'success', summary: 'Pronto', detail: novo ? 'Serviço cadastrado' : 'Serviço atualizado' });
            this.servicoDialog = false;
            await this.carregar();
        } catch (err) {
            this.erro(err);
        } finally {
            this.salvando = false;
        }
    }

    excluir(servico: Servico) {
        this.confirmationService.confirm({
            header: 'Excluir serviço',
            icon: 'pi pi-exclamation-triangle',
            message: `Excluir o serviço <b>${servico.nome}</b>?`,
            accept: async () => {
                try {
                    await this.servicoService.excluir(servico.id!);
                    this.messageService.add({ severity: 'success', summary: 'Pronto', detail: 'Serviço excluído' });
                    await this.carregar();
                } catch (err) {
                    this.erro(err);
                }
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    private erro(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: mensagemDeErro(err), life: 6000 });
    }
}
