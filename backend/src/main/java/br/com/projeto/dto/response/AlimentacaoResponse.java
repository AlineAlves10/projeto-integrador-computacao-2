package br.com.projeto.dto.response;

import br.com.projeto.Enum.LadoAmamentacaoEnum;
import br.com.projeto.Enum.TipoAlimentacaoEnum;
import br.com.projeto.Enum.TipoLeiteEnum;

import java.time.LocalDateTime;

public record AlimentacaoResponse(Long id, TipoAlimentacaoEnum tipo, LocalDateTime dataHora, Integer volumeMl,
                                  Integer duracaoMinutos, LadoAmamentacaoEnum lado, TipoLeiteEnum tipoLeite, String alimento,
                                  String quantidade, String observacao) {
}
