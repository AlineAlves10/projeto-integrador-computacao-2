// ng serve: as chamadas vão para /api no próprio servidor de desenvolvimento, que repassa para o
// Spring Boot (proxy.conf.json). Assim não é preciso liberar a porta 4200 no CORS do back-end.
export const environment = {
  apiUrl: '/api',
};
