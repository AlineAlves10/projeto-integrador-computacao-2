package br.com.projeto.dto.request;

import br.com.projeto.Enum.StatusHorarioPrevistoEnum;
import jakarta.validation.constraints.NotNull;

public record HorarioStatusRequest(@NotNull StatusHorarioPrevistoEnum status) {
}
