import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../auth.service';
import { mensagemDeErro } from '../../../shared/crud.service';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styles: [`
        :host ::ng-deep .p-password input { width: 100%; }
    `]
})
export class LoginComponent implements OnInit {

    nome = '';
    username = '';
    password = '';
    loading = false;
    modoCadastro = false;
    sessaoExpirada = false;
    docsUrl = environment.docsUrl;

    constructor(
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private messageService: MessageService
    ) { }

    ngOnInit() {
        // Quem já está logado não precisa ver o login - [Otávio Michels]
        if (this.authService.isAuthenticated()) {
            this.router.navigate(['/']);
            return;
        }
        this.sessaoExpirada = this.route.snapshot.queryParamMap.has('expirado');
    }

    alternarModo() {
        this.modoCadastro = !this.modoCadastro;
        this.password = '';
    }

    enviar() {
        return this.modoCadastro ? this.cadastrar() : this.login();
    }

    // Login: pega o token na API e vai para o painel - [Otávio Michels]
    async login(): Promise<void> {
        if (!this.username || !this.password) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha usuário e senha' });
            return;
        }
        this.loading = true;
        try {
            await this.authService.login({ username: this.username.trim(), password: this.password });
            this.router.navigate(['/']);
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Não foi possível entrar', detail: mensagemDeErro(error) });
        } finally {
            this.loading = false;
        }
    }

    // Cria a conta e já entra com ela - [Otávio Michels]
    async cadastrar(): Promise<void> {
        if (!this.username || !this.password) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha usuário e senha' });
            return;
        }
        this.loading = true;
        try {
            await this.authService.register({ nome: this.nome.trim(), username: this.username.trim(), password: this.password });
            this.messageService.add({ severity: 'success', summary: 'Conta criada', detail: 'Bem-vindo ao sistema!' });
            await this.authService.login({ username: this.username.trim(), password: this.password });
            this.router.navigate(['/']);
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Não foi possível criar a conta', detail: mensagemDeErro(error) });
        } finally {
            this.loading = false;
        }
    }
}
