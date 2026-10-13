package br.com.projeto.mapper;

import br.com.projeto.dto.request.UsuarioBebeRequest;
import br.com.projeto.dto.response.UsuarioBebeResponse;
import br.com.projeto.model.autenticacao.UsuarioBebe;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UsuarioBebeMapper {

    @Mapping(target = "id.usuarioId", source = "usuarioId")
    @Mapping(target = "id.bebeId", source = "bebeId")
    @Mapping(target = "dataVinculo", ignore = true)
    UsuarioBebe toEntity(UsuarioBebeRequest request);

    @Mapping(target = "usuarioId", source = "id.usuarioId")
    @Mapping(target = "bebeId", source = "id.bebeId")
    UsuarioBebeResponse toResponse(UsuarioBebe usuarioBebe);

    List<UsuarioBebeResponse> toResponseList(List<UsuarioBebe> usuarios);
}