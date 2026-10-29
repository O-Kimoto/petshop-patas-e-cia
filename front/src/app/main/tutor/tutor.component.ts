import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { Tutor } from './models/tutor';
import { TutorService } from './services/tutor.service';
import { Estado, LocalizacaoService, Municipio } from '../shared/localizacao.service';
import { mensagemDeErro } from '../shared/crud.service';
import { formatarTelefone } from '../shared/formatos';

// Lista usada só se a API do IBGE estiver fora do ar - [Otávio Michels]
const UFS_RESERVA = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

@Component({
    templateUrl: './tutor.component.html'
})
export class TutorComponent implements OnInit {

    tutores: Tutor[] = [];
    tutor: Tutor = {};
    tutorDialog = false;
    submitted = false;
    carregando = false;
    salvando = false;
    buscandoCep = false;

    estados: Estado[] = [];
    municipios: Municipio[] = [];

    // Colunas exportadas no botão "Exportar CSV" - [Otávio Michels]
    colunasCsv = [
        { field: 'nome', header: 'Nome' },
        { field: 'telefone', header: 'Telefone' },
        { field: 'email', header: 'E-mail' },
        { field: 'cidade', header: 'Cidade' },
        { field: 'uf', header: 'UF' },
        { field: 'total_pets', header: 'Pets' }
    ];

    constructor(
        private tutorService: TutorService,
        private localizacao: LocalizacaoService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router
    ) { }

    ngOnInit() {
        this.carregar();
        this.localizacao.listarEstados()
            .then(estados => this.estados = estados)
            .catch(() => this.estados = UFS_RESERVA.map(sigla => ({ id: 0, sigla, nome: sigla })));
    }

    // Busca a lista de tutores na API - [Otávio Michels]
    async carregar() {
        this.carregando = true;
        try {
            this.tutores = await this.tutorService.listar();
        } catch (err) {
            this.erro(err);
        } finally {
            this.carregando = false;
        }
    }

    abrirNovo() {
        this.tutor = {};
        this.municipios = [];
        this.submitted = false;
        this.tutorDialog = true;
    }

    editar(tutor: Tutor) {
        this.tutor = { ...tutor };
        this.submitted = false;
        this.tutorDialog = true;
        this.carregarMunicipios(tutor.uf);
    }

    // Preenche rua, bairro, cidade e UF a partir do CEP (ViaCEP) - [Otávio Michels]
    async buscarCep() {
        if ((this.tutor.cep || '').replace(/\D/g, '').length !== 8) return;
        this.buscandoCep = true;
        try {
            const endereco = await this.localizacao.buscarCep(this.tutor.cep!);
            if (!endereco) {
                this.messageService.add({ severity: 'warn', summary: 'CEP', detail: 'CEP não encontrado' });
                return;
            }
            this.tutor.logradouro = endereco.logradouro || this.tutor.logradouro;
            this.tutor.bairro = endereco.bairro || this.tutor.bairro;
            this.tutor.complemento = this.tutor.complemento || endereco.complemento;
            this.tutor.uf = endereco.uf;
            this.tutor.cidade = endereco.localidade;
            // As cidades do IBGE carregam em segundo plano; o CEP já deixa a cidade preenchida - [Otávio Michels]
            this.carregarMunicipios(endereco.uf);
        } catch {
            this.messageService.add({ severity: 'warn', summary: 'CEP', detail: 'Não foi possível consultar o ViaCEP. Preencha o endereço manualmente.' });
        } finally {
            this.buscandoCep = false;
        }
    }

    // Ao trocar a UF, carrega as cidades dela (IBGE) e limpa a cidade se não for da nova UF - [Otávio Michels]
    async aoMudarUf() {
        await this.carregarMunicipios(this.tutor.uf);
        if (!this.municipios.some(m => m.nome === this.tutor.cidade)) {
            this.tutor.cidade = undefined;
        }
    }

    async carregarMunicipios(uf?: string) {
        if (!uf) {
            this.municipios = [];
            return;
        }
        try {
            this.municipios = await this.localizacao.listarMunicipios(uf);
        } catch {
            this.municipios = [];
        }
    }

    aoDigitarTelefone(valor: string) {
        this.tutor.telefone = formatarTelefone(valor);
    }

    // Valida os obrigatórios e cria ou atualiza o tutor na API - [Otávio Michels]
    async salvar() {
        this.submitted = true;
        if (!this.tutor.nome?.trim() || !this.tutor.telefone?.trim()) return;

        this.salvando = true;
        try {
            const novo = !this.tutor.id;
            await this.tutorService.salvar(this.tutor);
            this.messageService.add({ severity: 'success', summary: 'Pronto', detail: novo ? 'Tutor cadastrado' : 'Tutor atualizado' });
            this.tutorDialog = false;
            await this.carregar();
        } catch (err) {
            this.erro(err);
        } finally {
            this.salvando = false;
        }
    }

    // Pede confirmação e exclui; a API recusa se o tutor ainda tiver pets - [Otávio Michels]
    excluir(tutor: Tutor) {
        this.confirmationService.confirm({
            header: 'Excluir tutor',
            icon: 'pi pi-exclamation-triangle',
            message: `Excluir o tutor <b>${tutor.nome}</b>?`,
            accept: async () => {
                try {
                    await this.tutorService.excluir(tutor.id!);
                    this.messageService.add({ severity: 'success', summary: 'Pronto', detail: 'Tutor excluído' });
                    await this.carregar();
                } catch (err) {
                    this.erro(err);
                }
            }
        });
    }

    // Abre a tela de pets já filtrada por este tutor - [Otávio Michels]
    // Link do WhatsApp do tutor (wa.me com o DDI 55); sem telefone válido, o botão não aparece - [Apolo Lins]
    linkWhatsApp(telefone?: string): string | null {
        const digitos = (telefone || '').replace(/\D/g, '');
        return digitos.length >= 10 ? `https://wa.me/55${digitos}` : null;
    }

    verPets(tutor: Tutor) {
        this.router.navigate(['/pets'], { queryParams: { tutor: tutor.id } });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    private erro(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: mensagemDeErro(err), life: 6000 });
    }
}
