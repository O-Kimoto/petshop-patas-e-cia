import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CrudService } from '../../shared/crud.service';
import { Servico } from '../models/servico';

// CRUD de serviços em /api/servicos - [Otávio Michels]
@Injectable({ providedIn: 'root' })
export class ServicoService extends CrudService<Servico> {
    protected recurso = 'servicos';
    protected chaveLista = 'servicos';
    protected chaveItem = 'servico';

    // POST /api/servicos/reajuste: aumenta (ou reduz, se negativo) os preços em %; sem ids vale para todos
    reajustar(percentual: number, ids: number[] = []): Promise<{ message: string; servicos: Servico[] }> {
        return firstValueFrom(this.http.post<any>(`${this.url}/reajuste`, { percentual, ids }));
    }
}
