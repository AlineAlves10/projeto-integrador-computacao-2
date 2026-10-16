package br.com.projeto.dto.response;

import br.com.projeto.Enum.TipoUsuarioEnum;

import java.time.LocalDateTime;

// Pessoa vinculada ao bebê. telefone e links só vêm preenchidos quando o usuário logado pode ver o contato.
public record ContatoResponse(Long usuarioId,
                              String nome,
                              TipoUsuarioEnum papel,
                              LocalDateTime dataVinculo,
                              boolean voce,
                              String telefone,
                              String linkLigacao,
                              String linkWhatsapp,
                              boolean podeRemover) {
}
