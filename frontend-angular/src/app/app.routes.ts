import { Routes } from '@angular/router';
import { autenticadoGuard, visitanteGuard } from './core/auth/auth.guards';
import { ShellComponent } from './core/layout/shell/shell.component';

export const routes: Routes = [
  // Login e cadastro (somente sem sessão)
  {
    path: '',
    canActivate: [visitanteGuard],
    loadComponent: () => import('./features/auth/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      { path: 'login', title: 'Babá Premium - Entrar', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'cadastro', title: 'Babá Premium - Cadastro', loadComponent: () => import('./features/auth/cadastro/cadastro.component').then(m => m.CadastroComponent) },
    ],
  },
  // Telas internas (sessão obrigatória), dentro da estrutura com menu e seletor de bebê
  {
    path: '',
    canActivate: [autenticadoGuard],
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', title: 'Babá Premium - Dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'rotina', title: 'Babá Premium - Rotina Diária', loadComponent: () => import('./features/rotina/rotina.component').then(m => m.RotinaComponent) },
      { path: 'saude', title: 'Babá Premium - Saúde', loadComponent: () => import('./features/saude/saude.component').then(m => m.SaudeComponent) },
      { path: 'estatisticas', title: 'Babá Premium - Gráficos', loadComponent: () => import('./features/estatisticas/estatisticas.component').then(m => m.EstatisticasComponent) },
      { path: 'diario', title: 'Babá Premium - Diário', loadComponent: () => import('./features/diario/diario.component').then(m => m.DiarioComponent) },
      { path: 'galeria', title: 'Babá Premium - Fotos & Vídeos', loadComponent: () => import('./features/galeria/galeria.component').then(m => m.GaleriaComponent) },
      { path: 'perfil', title: 'Babá Premium - Perfil', loadComponent: () => import('./features/perfil-bebe/perfil-bebe.component').then(m => m.PerfilBebeComponent) },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
