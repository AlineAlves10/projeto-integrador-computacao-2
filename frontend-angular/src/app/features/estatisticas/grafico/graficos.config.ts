import {
  BarController, BarElement, CategoryScale, Chart, ChartConfiguration, Filler, LinearScale, LineController,
  LineElement, PointElement, Tooltip,
} from 'chart.js';

// Registra só o que os dois gráficos usam (menor pacote que registerables)
Chart.register(LineController, LineElement, PointElement, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Filler);

const CORES = {
  primary: '#6366f1',
  primaryLight: 'rgba(99, 102, 241, 0.15)',
  secondary: '#0ea5e9',
  textMuted: '#64748b',
  gridLines: 'rgba(0, 0, 0, 0.05)',
};

export type TipoGrafico = 'sono' | 'alimentacao';

/** Dias sem registro chegam como null e aparecem como lacunas (não como zero). */
export type SerieDiaria = (number | null)[];

function sono(rotulos: string[], horas: SerieDiaria): ChartConfiguration<'line'> {
  const conhecidos = horas.filter((v): v is number => v !== null);
  return {
    type: 'line',
    data: {
      labels: rotulos,
      datasets: [{
        label: 'Horas de Sono',
        data: horas,
        borderColor: CORES.primary,
        backgroundColor: CORES.primaryLight,
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: CORES.primary,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        spanGaps: false, // não liga pontos por cima de dias sem registro
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} horas dormidas` } },
      },
      scales: {
        y: {
          min: Math.max(0, Math.floor(Math.min(...conhecidos) - 1)),
          max: Math.ceil(Math.max(...conhecidos) + 1),
          ticks: { color: CORES.textMuted, callback: valor => `${valor}h` },
          grid: { color: CORES.gridLines },
        },
        x: { ticks: { color: CORES.textMuted }, grid: { display: false } },
      },
    },
  };
}

function alimentacao(rotulos: string[], volumes: SerieDiaria): ChartConfiguration<'bar'> {
  return {
    type: 'bar',
    data: {
      labels: rotulos,
      datasets: [{
        label: 'Volume Total',
        data: volumes,
        backgroundColor: CORES.secondary,
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 32,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} ml ingeridos` } },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: CORES.textMuted, callback: valor => `${valor} ml` },
          grid: { color: CORES.gridLines },
        },
        x: { ticks: { color: CORES.textMuted }, grid: { display: false } },
      },
    },
  };
}

export function configurarGrafico(tipo: TipoGrafico, rotulos: string[], valores: SerieDiaria): ChartConfiguration {
  return (tipo === 'sono' ? sono(rotulos, valores) : alimentacao(rotulos, valores)) as ChartConfiguration;
}
