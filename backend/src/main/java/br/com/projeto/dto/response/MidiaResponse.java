package br.com.projeto.dto.response;

import br.com.projeto.Enum.TipoMidiaEnum;

import java.time.LocalDateTime;

// Sem URLs de arquivo: o cliente baixa miniatura e arquivo pelos endpoints autenticados da mídia.
public record MidiaResponse(Long id,
                            TipoMidiaEnum tipo,
                            String contentType,
                            long tamanhoBytes,
                            String descricao,
                            LocalDateTime dataEnvio,
                            Long enviadoPorId,
                            String enviadoPorNome,
                            boolean possuiMiniatura,
                            boolean podeExcluir) {
}
