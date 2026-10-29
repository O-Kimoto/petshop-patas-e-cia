import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Usuario } from './models/usuario';
import { UsuarioService } from './services/usuario.service';
import { AuthService } from '../middleware/auth/auth.service';
import { mensagemDeErro } from '../shared/crud.service';

@Component({
    templateUrl: './usuario.component.html'
})
export class UsuarioComponent implements OnInit {

    usuarios: Usuario[] = [];
    usuario: Usuario = {};
    usuarioDialog = false;
    submitted = false;
    carregando = false;
    salvando = false;

    // ID de quem está logado: esse usuário não pode se excluir - [Otávio Michels]
    idLogado: number | null;

    constructor(
        private usuarioService: UsuarioService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        authService: AuthService
    ) {
        this.idLogado = authService.getUsuario()?.id ?? null;
    }

    ngOnInit() {
        this.carregar();
    }

    async carregar() {
        this.carregando = true;
        try {
            this.usuarios = await this.usuarioService.listar();
        } catch (err) {
            this.erro(err);
        } finally {
            this.carregando = false;
        }
    }

    abrirNovo() {
        this.usuario = {};
        this.submitted = false;
        this.usuarioDialog = true;
    }

    editar(usuario: Usuario) {
        this.usuario = { ...usuario, password: '' };
        this.submitted = false;
        this.usuarioDialog = true;
    }

    // Senha obrigatória só no cadastro; na edição, vazia = mantém a atual - [Otávio Michels]
    get senhaInvalida(): boolean {
        const senha = this.usuario.password || '';
        if (!this.usuario.id && !senha) return true;
        return senha.length > 0 && senha.length < 6;
    }

    async salvar() {
        this.submitted = true;
        if (!this.usuario.nome?.trim() || !this.usuario.username?.trim() || this.senhaInvalida) return;

        this.salvando = true;
        try {
            const novo = !this.usuario.id;
            const dados = { ...this.usuario };
            if (!dados.password) delete dados.password;
            await this.usuarioService.salvar(dados);
            this.messageService.add({ severity: 'success', summary: 'Pronto', detail: novo ? 'Usuário criado' : 'Usuário atualizado' });
            this.usuarioDialog = false;
            await this.carregar();
        } catch (err) {
            this.erro(err);
        } finally {
            this.salvando = false;
        }
    }

    excluir(usuario: Usuario) {
        this.confirmationService.confirm({
            header: 'Excluir usuário',
            icon: 'pi pi-exclamation-triangle',
            message: `Excluir o usuário <b>${usuario.username}</b>? Ele não vai mais conseguir entrar no sistema.`,
            accept: async () => {
                try {
                    await this.usuarioService.excluir(usuario.id!);
                    this.messageService.add({ severity: 'success', summary: 'Pronto', detail: 'Usuário excluído' });
                    await this.carregar();
                } catch (err) {
                    this.erro(err);
                }
            }
        });
    }

    private erro(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: mensagemDeErro(err), life: 6000 });
    }
}
