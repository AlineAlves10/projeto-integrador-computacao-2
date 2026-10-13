package br.com.projeto.mapper;

import br.com.projeto.dto.request.BebeRequest;
import br.com.projeto.dto.response.BebeResponse;
import br.com.projeto.model.autenticacao.Bebe;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BebeMapper {

    Bebe map(BebeRequest request);

    BebeResponse map(Bebe bebe);
}