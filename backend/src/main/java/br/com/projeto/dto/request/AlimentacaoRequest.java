package br.com.projeto.dto.request;

import br.com.projeto.Enum.LadoAmamentacaoEnum;
import br.com.projeto.Enum.TipoAlimentacaoEnum;
import br.com.projeto.Enum.TipoLeiteEnum;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

// Campos por tipo: PEITO -> lado (duração opcional); MAMADEIRA -> tipoLeite e volumeMl; SOLIDA -> alimento e quantidade.
// Observação vale para todos. Campos de outro tipo são descartados pelo serviço antes de persistir.
public record AlimentacaoRequest(@NotNull TipoAlimentacaoEnum tipo,
                                 @NotNull LocalDateTime dataHora,
                                 @Positive @Max(2000) Integer volumeMl,
                                 @Positive @Max(300) Integer duracaoMinutos,
                                 LadoAmamentacaoEnum lado,
                                 TipoLeiteEnum tipoLeite,
                                 @Size(max = 120) String alimento,
                                 @Size(max = 60) String quantidade,
                                 @Size(max = 255) String observacao) {
}
