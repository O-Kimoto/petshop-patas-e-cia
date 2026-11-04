// Usuário do sistema; password só vai para a API quando é preenchida - [Otávio Michels]
export interface Usuario {
    id?: number;
    nome?: string;
    username?: string;
    password?: string;
    criado_em?: string;
}
