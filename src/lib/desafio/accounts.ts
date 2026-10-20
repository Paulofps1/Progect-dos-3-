// Contas fixas dos jogadores: e-mail e senha internos do app (não são da pessoa).
// Dá para trocar por variáveis de ambiente.
import { slug } from './rules';

export const PLAYER_EMAIL_DOMAIN = import.meta.env.VITE_DESAFIO_EMAIL_DOMAIN || 'desafiodos3.app';
export const PLAYER_PASSWORD = import.meta.env.VITE_DESAFIO_SENHA || 'desafio-dos-3-2026';
export const playerEmail = (player: string) => `${slug(player)}@${PLAYER_EMAIL_DOMAIN}`;
