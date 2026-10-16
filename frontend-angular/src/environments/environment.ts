// Build de produção (ng build): o front é servido em outra origem (ex.: nginx em localhost:3000, já liberada
// no CORS do back-end) e chama a API Spring Boot diretamente. Os controllers não usam prefixo /api.
export const environment = {
  apiUrl: 'http://localhost:8080',
};
