import { Injectable } from '@angular/core';
import { CrudService } from '../../shared/crud.service';
import { Usuario } from '../models/usuario';

// CRUD de usuários em /api/users - [Otávio Michels]
@Injectable({ providedIn: 'root' })
export class UsuarioService extends CrudService<Usuario> {
    protected recurso = 'users';
    protected chaveLista = 'users';
    protected chaveItem = 'user';
}
