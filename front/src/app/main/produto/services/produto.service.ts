import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CrudService } from '../../shared/crud.service';
import { Produto } from '../models/produto';

// CRUD de produtos em /api/produtos (aceita filtro ?categoria=) - [Otávio Michels]
@Injectable({ providedIn: 'root' })
export class ProdutoService extends CrudService<Produto> {
    protected recurso = 'produtos';
    protected chaveLista = 'produtos';
    protected chaveItem = 'produto';

    // POST /api/produtos/:id/estoque: positivo dá entrada, negativo dá saída; a API recusa se faltar estoque
    movimentarEstoque(id: number, quantidade: number): Promise<{ message: string; produto: Produto }> {
        return firstValueFrom(this.http.post<any>(`${this.url}/${id}/estoque`, { quantidade }));
    }
}
