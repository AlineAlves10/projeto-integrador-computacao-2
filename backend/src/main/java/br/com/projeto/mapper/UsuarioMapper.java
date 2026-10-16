package br.com.projeto.mapper;

import br.com.projeto.dto.request.UsuarioRequest;
import br.com.projeto.dto.response.UsuarioResponse;
import br.com.projeto.model.autenticacao.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UsuarioMapper {

    // id, foto e data de cadastro nunca vêm do cliente: com um id existente, o save faria merge e
    // sobrescreveria a conta de outra pessoa (POST /usuarios é público)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "fotoPerfil", ignore = true)
    @Mapping(target = "dataCadastro", ignore = true)
    @Mapping(target = "bebesVinculados", ignore = true)
    Usuario toEntity(UsuarioRequest request);

    UsuarioResponse toResponse(Usuario usuario);

    List<UsuarioResponse> toResponseList(List<Usuario> usuarios);
}