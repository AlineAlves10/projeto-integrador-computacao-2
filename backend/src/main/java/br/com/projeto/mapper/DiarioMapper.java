package br.com.projeto.mapper;

import br.com.projeto.dto.response.DiarioResponse;
import br.com.projeto.dto.response.HorarioPrevistoResponse;
import br.com.projeto.model.agenda.HorarioPrevisto;
import br.com.projeto.model.diario.DiarioNotas;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface DiarioMapper {

    @Mapping(target = "autorId", source = "autor.id")
    @Mapping(target = "autorNome", source = "autor.nome")
    DiarioResponse toResponse(DiarioNotas nota);

    @Mapping(target = "criadoPorNome", source = "criadoPor.nome")
    HorarioPrevistoResponse toResponse(HorarioPrevisto horario);
}
