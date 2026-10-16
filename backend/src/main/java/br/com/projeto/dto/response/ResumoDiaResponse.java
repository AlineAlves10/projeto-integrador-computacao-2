package br.com.projeto.dto.response;

import java.time.LocalDate;
import java.util.List;

// Valores Integer nulos significam "sem informação" (ex.: nenhuma mamadeira com volume informado), não zero.
public record ResumoDiaResponse(LocalDate data,
                                int totalRegistros,
                                Alimentacao alimentacao,
                                Sono sono,
                                Fraldas fraldas,
                                int atividades,
                                int medicamentos,
                                List<HorarioPrevistoResponse> proximosHorarios,
                                List<String> observacoesDiario) {

    // mamadeirasLeiteMaterno + mamadeirasFormula pode ser menor que mamadeiras (registros antigos sem o tipo de leite)
    public record Alimentacao(int refeicoes, int mamadeiras, int mamadeirasLeiteMaterno, int mamadeirasFormula,
                              int amamentacoes, int solidas,
                              Integer volumeTotalMl, int mamadeirasSemVolume) {
    }

    // minutosTotais considera apenas períodos encerrados iniciados no dia; emAndamento conta os sem fim
    public record Sono(int periodos, Integer minutosTotais, int emAndamento) {
    }

    // xixi/coco/misto/limpa: trocas por tipo (exclusivos). trocasComXixi/trocasComCoco: trocas em que houve
    // cada eliminação (uma troca com ambos entra nas duas), sem alterar o total de trocas.
    public record Fraldas(int trocas, int xixi, int coco, int misto, int limpa, int trocasComXixi, int trocasComCoco) {
    }
}
