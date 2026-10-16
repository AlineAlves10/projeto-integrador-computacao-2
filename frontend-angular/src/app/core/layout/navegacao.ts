/** Telas internas: usadas pela sidebar (computador) e pela barra inferior (celular). */
export interface ItemNavegacao {
  rota: string;
  icone: string;
  rotulo: string;
  rotuloCurto: string;
}

export const ITENS_NAVEGACAO: ItemNavegacao[] = [
  { rota: '/dashboard', icone: '🏠', rotulo: 'Dashboard', rotuloCurto: 'Início' },
  { rota: '/rotina', icone: '📅', rotulo: 'Rotina Diária', rotuloCurto: 'Rotina' },
  { rota: '/saude', icone: '🩺', rotulo: 'Saúde & Vacinas', rotuloCurto: 'Saúde' },
  { rota: '/estatisticas', icone: '📊', rotulo: 'Gráficos', rotuloCurto: 'Gráficos' },
  { rota: '/diario', icone: '📝', rotulo: 'Diário', rotuloCurto: 'Diário' },
  { rota: '/galeria', icone: '📷', rotulo: 'Fotos & Vídeos', rotuloCurto: 'Galeria' },
  { rota: '/perfil', icone: '👤', rotulo: 'Perfil', rotuloCurto: 'Perfil' },
];
