import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { dataParaApi } from '../shared/formatos';

export interface ResumoDashboard {
    totais: { tutores: number; pets: number; servicos: number; produtos: number; agendamentos_hoje: number };
    proximos: { id: number; data_hora: string; status: string; pet_nome: string; tutor_nome: string; servico_nome: string }[];
    estoqueBaixo: { id: number; nome: string; categoria: string; estoque: number }[];
    porStatus: { status: string; total: number }[];
}

// Busca o resumo do painel em /api/dashboard, mandando a data de hoje do navegador - [Otávio Michels]
@Injectable({ providedIn: 'root' })
export class DashboardService {
    constructor(private http: HttpClient) { }

    resumo(): Promise<ResumoDashboard> {
        return firstValueFrom(
            this.http.get<ResumoDashboard>(`${environment.baseUrl}/dashboard`, { params: { hoje: dataParaApi() } })
        );
    }
}
