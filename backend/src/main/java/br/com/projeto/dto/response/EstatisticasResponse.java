package br.com.projeto.dto.response;

import java.time.LocalDate;
import java.util.List;

// Estatísticas por dia em um período. Dias sem nenhum registro têm contagens nulas (não zero),
// para não confundir "não registrado" com "não aconteceu".
public record EstatisticasResponse(LocalDate inicio,
                                   LocalDate fim,
                                   List<Dia> dias,
                                   Periodo periodo,
                                   Periodo periodoAnterior) {

    public record Dia(LocalDate data,
                      boolean possuiRegistros,
                      Integer sonoMinutos,
                      Integer periodosSono,
                      Integer refeicoes,
                      Integer volumeMl,
                      Integer fraldas,
                      Integer trocasComXixi,
                      Integer trocasComCoco) {
    }

    // Médias calculadas só sobre os dias que têm a informação; nulas quando não há dados
    public record Periodo(LocalDate inicio,
                          LocalDate fim,
                          int diasComRegistro,
                          Double mediaSonoMinutos,
                          Double mediaRefeicoes,
                          Double mediaVolumeMl,
                          Double mediaFraldas,
                          Double mediaTrocasComXixi,
                          Double mediaTrocasComCoco) {
    }
}
