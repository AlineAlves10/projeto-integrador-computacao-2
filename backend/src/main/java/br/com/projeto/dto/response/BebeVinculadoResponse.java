package br.com.projeto.dto.response;

import br.com.projeto.Enum.TipoUsuarioEnum;

// Bebê acessível pelo usuário logado e o papel dele nesse vínculo
public record BebeVinculadoResponse(BebeResponse bebe, TipoUsuarioEnum papel) {
}
