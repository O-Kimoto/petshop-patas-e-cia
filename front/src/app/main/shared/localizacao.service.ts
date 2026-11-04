import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface Estado { id: number; sigla: string; nome: string; }
export interface Municipio { id: number; nome: string; }
export interface EnderecoViaCep { logradouro: string; bairro: string; localidade: string; uf: string; complemento: string; }

// Tempo máximo de espera pelas APIs externas, para a tela não ficar travada se uma delas cair - [Otávio Michels]
const TEMPO_LIMITE_MS = 8000;

// fetch com tempo limite: cancela a requisição (AbortController) se passar do prazo - [Otávio Michels]
async function buscarJson(url: string): Promise<any> {
    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
    try {
        const resp = await fetch(url, { signal: controle.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return await resp.json();
    } finally {
        clearTimeout(timer);
    }
}

// Consulta ViaCEP (endereço pelo CEP) e IBGE (estados e municípios) usando a Fetch API - [Otávio Michels]
@Injectable({ providedIn: 'root' })
export class LocalizacaoService {
    private estados?: Promise<Estado[]>;
    private municipios = new Map<string, Promise<Municipio[]>>();

    // Busca o endereço pelo CEP; devolve null se o CEP não existir - [Otávio Michels]
    async buscarCep(cep: string): Promise<EnderecoViaCep | null> {
        const digitos = (cep || '').replace(/\D/g, '');
        if (digitos.length !== 8) return null;
        const dados = await buscarJson(`${environment.viaCepUrl}/${digitos}/json/`);
        return dados.erro ? null : dados;
    }

    // Lista de estados do IBGE em ordem alfabética, guardada em memória depois da primeira chamada - [Otávio Michels]
    listarEstados(): Promise<Estado[]> {
        if (!this.estados) {
            this.estados = buscarJson(`${environment.ibgeUrl}/estados?orderBy=nome`)
                .catch(err => { this.estados = undefined; throw err; });
        }
        return this.estados;
    }

    // Municípios de uma UF (também em cache, por UF) - [Otávio Michels]
    listarMunicipios(uf: string): Promise<Municipio[]> {
        if (!uf) return Promise.resolve([]);
        if (!this.municipios.has(uf)) {
            const req = buscarJson(`${environment.ibgeUrl}/estados/${uf}/municipios?orderBy=nome`)
                .catch(err => { this.municipios.delete(uf); throw err; });
            this.municipios.set(uf, req);
        }
        return this.municipios.get(uf)!;
    }
}
