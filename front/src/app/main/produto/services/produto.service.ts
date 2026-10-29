import { Injectable } from '@angular/core';
import { CrudService } from '../../shared/crud.service';
import { Produto } from '../models/produto';

// CRUD de produtos em /api/produtos (aceita filtro ?categoria=) - [Otávio Michels]
@Injectable({ providedIn: 'root' })
export class ProdutoService extends CrudService<Produto> {
    protected recurso = 'produtos';
    protected chaveLista = 'produtos';
    protected chaveItem = 'produto';
}
