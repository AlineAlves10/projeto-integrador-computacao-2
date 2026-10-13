package br.com.projeto.mapper;

import br.com.projeto.dto.request.UsuarioRequest;
import br.com.projeto.dto.response.UsuarioResponse;
import br.com.projeto.model.autenticacao.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UsuarioMapper {

    Usuario toEntity(UsuarioRequest request);

    UsuarioResponse toResponse(Usuario usuario);

    List<UsuarioResponse> toResponseList(List<Usuario> usuarios);
}