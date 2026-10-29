import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { Produto } from './models/produto';
import { ProdutoService } from './services/produto.service';
import { mensagemDeErro } from '../shared/crud.service';

// Abaixo ou igual a isso o estoque aparece em amarelo (mesmo limite do painel inicial) - [Otávio Michels]
const ESTOQUE_BAIXO = 5;

@Component({
    templateUrl: './produto.component.html'
})
export class ProdutoComponent implements OnInit {

    produtos: Produto[] = [];
    produto: Produto = {};
    produtoDialog = false;
    submitted = false;
    carregando = false;
    salvando = false;
    filtroCategoria: string | null = null;

    categorias = ['Ração', 'Brinquedos', 'Medicamentos', 'Acessórios', 'Higiene'];

    colunasCsv = [
        { field: 'nome', header: 'Nome' },
        { field: 'categoria', header: 'Categoria' },
        { field: 'descricao', header: 'Descrição' },
        { field: 'preco', header: 'Preço' },
        { field: 'estoque', header: 'Estoque' }
    ];

    constructor(
        private produtoService: ProdutoService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) { }

    ngOnInit() {
        this.carregar();
    }

    // O filtro de categoria é feito pela própria API (?categoria=) - [Otávio Michels]
    async carregar() {
        this.carregando = true;
        try {
            this.produtos = await this.produtoService.listar(this.filtroCategoria ? { categoria: this.filtroCategoria } : {});
        } catch (err) {
            this.erro(err);
        } finally {
            this.carregando = false;
        }
    }

    abrirNovo() {
        this.produto = { estoque: 0, categoria: this.filtroCategoria || undefined };
        this.submitted = false;
        this.produtoDialog = true;
    }

    editar(produto: Produto) {
        this.produto = { ...produto };
        this.submitted = false;
        this.produtoDialog = true;
    }

    async salvar() {
        this.submitted = true;
        const p = this.produto;
        if (!p.nome?.trim() || p.preco === null || p.preco === undefined || p.estoque === null || p.estoque === undefined) return;

        this.salvando = true;
        try {
            const novo = !p.id;
            await this.produtoService.salvar(p);
            this.messageService.add({ severity: 'success', summary: 'Pronto', detail: novo ? 'Produto cadastrado' : 'Produto atualizado' });
            this.produtoDialog = false;
            await this.carregar();
        } catch (err) {
            this.erro(err);
        } finally {
            this.salvando = false;
        }
    }

    excluir(produto: Produto) {
        this.confirmationService.confirm({
            header: 'Excluir produto',
            icon: 'pi pi-exclamation-triangle',
            message: `Excluir o produto <b>${produto.nome}</b>?`,
            accept: async () => {
                try {
                    await this.produtoService.excluir(produto.id!);
                    this.messageService.add({ severity: 'success', summary: 'Pronto', detail: 'Produto excluído' });
                    await this.carregar();
                } catch (err) {
                    this.erro(err);
                }
            }
        });
    }

    // Cor da etiqueta de estoque: vermelho zerado, amarelo baixo, verde normal - [Otávio Michels]
    severidadeEstoque(estoque = 0): string {
        if (estoque === 0) return 'danger';
        if (estoque <= ESTOQUE_BAIXO) return 'warning';
        return 'success';
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    private erro(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: mensagemDeErro(err), life: 6000 });
    }
}
