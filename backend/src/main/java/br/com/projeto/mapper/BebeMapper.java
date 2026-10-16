package br.com.projeto.mapper;

import br.com.projeto.dto.request.BebeRequest;
import br.com.projeto.dto.response.BebeResponse;
import br.com.projeto.model.autenticacao.Bebe;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BebeMapper {

    Bebe map(BebeRequest request);

    @Mapping(target = "possuiFoto", expression = "java(br.com.projeto.service.FotoBebeService.nomeArquivoValido(bebe.getFotoPerfil()))")
    BebeResponse map(Bebe bebe);
}
