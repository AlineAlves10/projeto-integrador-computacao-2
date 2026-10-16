/**
 * charts.js - Módulo de Visualização de Dados e Estatísticas
 * Projeto Integrador: Babá Premium
 * Dependência: Chart.js (v4.x ou v3.x via CDN)
 */

const ChartsModule = {
  // Mapa de controle para destruir e recriar gráficos sem conflitos de memória
  instancias: {},

  // Paleta de cores padronizada do projeto
  cores: {
    primary: "#6366f1",
    primaryLight: "rgba(99, 102, 241, 0.15)",
    secondary: "#0ea5e9",
    secondaryLight: "rgba(14, 165, 233, 0.2)",
    accentOrange: "#f59e0b",
    accentOrangeLight: "rgba(245, 158, 11, 0.2)",
    textMuted: "#64748b",
    gridLines: "rgba(0, 0, 0, 0.05)"
  },

  /**
   * Destrói uma instância de gráfico pré-existente no canvas antes de desenhar um novo
   * @param {string} canvasId 
   */
  destruirSeExistir(canvasId) {
    if (this.instancias[canvasId]) {
      this.instancias[canvasId].destroy();
      delete this.instancias[canvasId];
    }
  },

  /**
   * 1. Gráfico de Horas de Sono (Linha Suave com Área Sombreada)
   * @param {string} canvasId - Ex: 'graficoSono'
   * @param {Array<string>} labels - Ex: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
   * @param {Array<number>} dadosHoras - Ex: [13.2, 14.0, 12.8, 14.5, 13.5, 14.2, 13.8]
   */
  criarGraficoSono(canvasId, labels, dadosHoras) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.warn(`[Charts] Elemento canvas '#${canvasId}' não encontrado.`);
      return null;
    }

    this.destruirSeExistir(canvasId);

    const ctx = canvas.getContext("2d");
    this.instancias[canvasId] = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Horas de Sono",
          data: dadosHoras,
          borderColor: this.cores.primary,
          backgroundColor: this.cores.primaryLight,
          borderWidth: 2.5,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: this.cores.primary,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          spanGaps: false // não liga pontos por cima de dias sem registro
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.parsed.y} horas dormidas`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            // Dias sem registro chegam como null e são ignorados na escala
            min: Math.max(0, Math.floor(Math.min(...dadosHoras.filter(v => v !== null)) - 1)),
            max: Math.ceil(Math.max(...dadosHoras.filter(v => v !== null)) + 1),
            ticks: {
              color: this.cores.textMuted,
              callback: (val) => `${val}h`
            },
            grid: { color: this.cores.gridLines }
          },
          x: {
            ticks: { color: this.cores.textMuted },
            grid: { display: false }
          }
        }
      }
    });

    return this.instancias[canvasId];
  },

  /**
   * 2. Gráfico de Alimentação / Leite (Barras Arredondadas)
   * @param {string} canvasId - Ex: 'graficoAlimentacao'
   * @param {Array<string>} labels - Ex: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
   * @param {Array<number>} dadosMl - Ex: [720, 810, 750, 800, 760, 840, 790]
   */
  criarGraficoAlimentacao(canvasId, labels, dadosMl) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.warn(`[Charts] Elemento canvas '#${canvasId}' não encontrado.`);
      return null;
    }

    this.destruirSeExistir(canvasId);

    const ctx = canvas.getContext("2d");
    this.instancias[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Volume Total",
          data: dadosMl,
          backgroundColor: this.cores.secondary,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 32
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.parsed.y} ml ingeridos`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: this.cores.textMuted,
              callback: (val) => `${val} ml`
            },
            grid: { color: this.cores.gridLines }
          },
          x: {
            ticks: { color: this.cores.textMuted },
            grid: { display: false }
          }
        }
      }
    });

    return this.instancias[canvasId];
  },

  /**
   * 3. Gráfico Opcional: Proporção de Trocas de Fralda (Doughnut / Rosca)
   * @param {string} canvasId - Ex: 'graficoFraldas'
   * @param {number} xixi - Quantidade de trocas de xixi
   * @param {number} coco - Quantidade de trocas de cocô
   * @param {number} ambos - Quantidade de trocas de ambos
   */
  criarGraficoFraldas(canvasId, xixi, coco, ambos) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    this.destruirSeExistir(canvasId);

    const ctx = canvas.getContext("2d");
    this.instancias[canvasId] = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Xixi", "Cocô", "Xixi + Cocô"],
        datasets: [{
          data: [xixi, coco, ambos],
          backgroundColor: ["#38bdf8", "#fbbf24", "#34d399"],
          borderWidth: 2,
          borderColor: "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 12, color: this.cores.textMuted }
          }
        }
      }
    });

    return this.instancias[canvasId];
  }
};

// Disponibiliza o módulo globalmente
window.ChartsModule = ChartsModule;