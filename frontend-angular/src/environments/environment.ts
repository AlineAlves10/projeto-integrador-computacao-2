// Build de produção (ng build): o nginx do próprio container repassa /api para o Spring Boot
// pela rede interna do Docker (nginx.conf). Os controllers não usam prefixo /api.
export const environment = {
  apiUrl: '/api',
};
