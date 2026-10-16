package br.com.projeto.service;

import br.com.projeto.exception.RegraNegocioException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

// Intervalo [inicio, fimExclusivo) usado nas consultas por data/período e validações de data comuns aos registros
public record PeriodoConsulta(LocalDate primeiroDia, LocalDate ultimoDia) {

    private static final long MAXIMO_DIAS = 93;
    private static final long TOLERANCIA_MINUTOS = 5; // diferença de relógio entre navegador e servidor

    public static PeriodoConsulta de(LocalDate inicio, LocalDate fim) {
        LocalDate primeiro = inicio != null ? inicio : LocalDate.now();
        LocalDate ultimo = fim != null ? fim : primeiro;
        if (ultimo.isBefore(primeiro)) {
            throw new RegraNegocioException("A data final não pode ser anterior à data inicial.");
        }
        if (ChronoUnit.DAYS.between(primeiro, ultimo) >= MAXIMO_DIAS) {
            throw new RegraNegocioException("Consulte no máximo " + MAXIMO_DIAS + " dias por vez.");
        }
        return new PeriodoConsulta(primeiro, ultimo);
    }

    public LocalDateTime inicio() {
        return primeiroDia.atStartOfDay();
    }

    public LocalDateTime fimExclusivo() {
        return ultimoDia.plusDays(1).atStartOfDay();
    }

    public long quantidadeDias() {
        return ChronoUnit.DAYS.between(primeiroDia, ultimoDia) + 1;
    }

    // Registros representam algo que já aconteceu; o planejado vai em "Próximos horários"
    public static void validarNaoFuturo(LocalDateTime dataHora) {
        if (dataHora != null && dataHora.isAfter(LocalDateTime.now().plusMinutes(TOLERANCIA_MINUTOS))) {
            throw new RegraNegocioException("A data/hora de um registro não pode estar no futuro. Para planejar, use Próximos horários.");
        }
    }

    public static void validarNaoPassado(LocalDateTime dataHora) {
        if (dataHora != null && dataHora.isBefore(LocalDateTime.now().minusMinutes(TOLERANCIA_MINUTOS))) {
            throw new RegraNegocioException("O horário previsto não pode estar no passado.");
        }
    }
}
