import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { Pet } from './models/pet';
import { PetService } from './services/pet.service';
import { Tutor } from '../tutor/models/tutor';
import { TutorService } from '../tutor/services/tutor.service';
import { mensagemDeErro } from '../shared/crud.service';

@Component({
    templateUrl: './pet.component.html'
})
export class PetComponent implements OnInit, OnDestroy {

    pets: Pet[] = [];
    pet: Pet = {};
    tutores: Tutor[] = [];
    petDialog = false;
    submitted = false;
    carregando = false;
    salvando = false;

    // Tutor escolhido no filtro (vem da URL ?tutor=ID quando chega pela tela de tutores) - [Otávio Michels]
    filtroTutor: number | null = null;

    especies = ['Cachorro', 'Gato', 'Pássaro', 'Peixe', 'Roedor', 'Réptil', 'Outro'];
    sexos = [
        { label: 'Macho', value: 'M' },
        { label: 'Fêmea', value: 'F' }
    ];

    colunasCsv = [
        { field: 'nome', header: 'Nome' },
        { field: 'especie', header: 'Espécie' },
        { field: 'raca', header: 'Raça' },
        { field: 'sexo', header: 'Sexo' },
        { field: 'tutor_nome', header: 'Tutor' }
    ];

    private sub?: Subscription;

    constructor(
        private petService: PetService,
        private tutorService: TutorService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit() {
        this.tutorService.listar().then(t => this.tutores = t).catch(err => this.erro(err));
        this.sub = this.route.queryParamMap.subscribe(params => {
            this.filtroTutor = params.get('tutor') ? Number(params.get('tutor')) : null;
            this.carregar();
        });
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
    }

    // Lista todos os pets ou só os do tutor do filtro - [Otávio Michels]
    async carregar() {
        this.carregando = true;
        try {
            this.pets = this.filtroTutor ? await this.petService.listarDoTutor(this.filtroTutor) : await this.petService.listar();
        } catch (err) {
            this.erro(err);
        } finally {
            this.carregando = false;
        }
    }

    // Guarda o filtro na URL, assim o botão voltar do navegador funciona - [Otávio Michels]
    mudarFiltroTutor(tutorId: number | null) {
        this.router.navigate([], { relativeTo: this.route, queryParams: { tutor: tutorId || null } });
    }

    abrirNovo() {
        // Se a lista está filtrada por um tutor, o novo pet já vem com ele selecionado - [Otávio Michels]
        this.pet = { tutor_id: this.filtroTutor || undefined };
        this.submitted = false;
        this.petDialog = true;
    }

    editar(pet: Pet) {
        this.pet = { ...pet };
        this.submitted = false;
        this.petDialog = true;
    }

    async salvar() {
        this.submitted = true;
        if (!this.pet.nome?.trim() || !this.pet.especie?.trim() || !this.pet.sexo || !this.pet.tutor_id) return;

        this.salvando = true;
        try {
            const novo = !this.pet.id;
            await this.petService.salvar(this.pet);
            this.messageService.add({ severity: 'success', summary: 'Pronto', detail: novo ? 'Pet cadastrado' : 'Pet atualizado' });
            this.petDialog = false;
            await this.carregar();
        } catch (err) {
            this.erro(err);
        } finally {
            this.salvando = false;
        }
    }

    excluir(pet: Pet) {
        this.confirmationService.confirm({
            header: 'Excluir pet',
            icon: 'pi pi-exclamation-triangle',
            message: `Excluir o pet <b>${pet.nome}</b>?`,
            accept: async () => {
                try {
                    await this.petService.excluir(pet.id!);
                    this.messageService.add({ severity: 'success', summary: 'Pronto', detail: 'Pet excluído' });
                    await this.carregar();
                } catch (err) {
                    this.erro(err);
                }
            }
        });
    }

    // Ícone por espécie para facilitar a leitura da tabela - [Otávio Michels]
    iconeEspecie(especie?: string): string {
        switch (especie) {
            case 'Cachorro': return '🐶';
            case 'Gato': return '🐱';
            case 'Pássaro': return '🐦';
            case 'Peixe': return '🐟';
            case 'Roedor': return '🐹';
            case 'Réptil': return '🦎';
            default: return '🐾';
        }
    }

    get nomeTutorFiltro(): string {
        return this.tutores.find(t => t.id === this.filtroTutor)?.nome || '';
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    private erro(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: mensagemDeErro(err), life: 6000 });
    }
}
