# Babá Premium — front-end Angular

Front-end oficial do Babá Premium em **Angular 19**, com TypeScript estrito e HTML, TypeScript e CSS separados
por componente. Substituiu o front-end anterior em HTML/CSS/JS, mantendo os mesmos contratos da API.

> Angular 19 é a versão mais recente compatível com o Node 18.19 deste ambiente (Angular 20+ exige Node 20.19+).

## Como executar

```bash
npm install
npm start            # ng serve em http://localhost:4200
```

Em desenvolvimento as chamadas vão para `/api` e o `proxy.conf.json` repassa para `http://localhost:8080`
(sem prefixo), então não é preciso liberar a porta 4200 no CORS do back-end.

```bash
npm run build        # gera dist/frontend-angular/browser
```

No build de produção a URL da API é `http://localhost:8080` (`src/environments/environment.ts`), chamada a partir
de uma origem já liberada no CORS (`localhost:3000`).

### Docker

O serviço `frontend` do `docker-compose.yml` usa o `Dockerfile` desta pasta: compila o Angular em uma imagem Node e
serve `dist/frontend-angular/browser` em nginx com o `nginx.conf` (todas as rotas do Angular caem no `index.html`).

```bash
docker compose up -d --build frontend    # http://localhost:3000
```

## Organização

```
src/app/
  core/                 serviços centrais (uma instância para o app)
    api/                um serviço por controller do Spring (BebesApi, RotinaApi, MidiasApi...)
    auth/               AuthService (sessão JWT), interceptor do token e guards de rota
    bebe-ativo/         BebeAtivoService: bebê selecionado, compartilhado por todas as telas
    arquivos/           validação de fotos/vídeos e miniatura de vídeo antes do envio
    http/               ApiError e interceptor que transforma falhas HTTP em mensagens
    config/             URL da API (token API_URL) e chaves do localStorage
    layout/             ShellComponent (menu + seletor de bebê) e itens de navegação
  shared/
    models/             tipos TypeScript dos DTOs e enums do back-end
    components/         sidebar, barra inferior, seletor de bebê, modal, mensagem, foto, seletor de foto,
                        campos do bebê, botões de registro rápido
    pipes/ utils/       datas, telefone, tamanho de arquivo e validadores
  features/
    auth/               login e cadastro (com revisão antes de concluir)
    dashboard/          painel do dia
    rotina/             histórico por data, modal de registro e linha do tempo (reusados no dashboard)
    saude/              caderneta (medidas, vacinas, medicamentos, próxima consulta)
    estatisticas/       indicadores e gráficos (Chart.js)
    diario/             anotações
    galeria/            fotos e vídeos privados
    perfil-bebe/        bebê selecionado, vínculos e contatos, novo bebê, conta
```

## Segurança

- O token só é anexado a requisições para a URL da API (`authInterceptor`).
- Fotos e vídeos são baixados com o token e exibidos por URLs `blob:` temporárias, liberadas ao sair da tela;
  nenhuma mídia tem endereço público.
- Telefones e permissões vêm prontos do servidor; a interface só esconde botões que o servidor recusaria.
- Token vencido é descartado ao abrir o app; sessão expirada durante o uso (401) volta para o login.
