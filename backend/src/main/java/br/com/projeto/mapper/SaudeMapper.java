package br.com.projeto.mapper;

import br.com.projeto.dto.request.CrescimentoRequest;
import br.com.projeto.dto.request.MedicamentoRequest;
import br.com.projeto.dto.request.VacinaRequest;
import br.com.projeto.dto.response.CrescimentoResponse;
import br.com.projeto.dto.response.MedicamentoResponse;
import br.com.projeto.dto.response.VacinaResponse;
import br.com.projeto.model.crescimento.RegistroCrescimento;
import br.com.projeto.model.saude.RegistroMedicamento;
import br.com.projeto.model.saude.RegistroVacina;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface SaudeMapper {

    RegistroCrescimento toEntity(CrescimentoRequest request);

    CrescimentoResponse toResponse(RegistroCrescimento registro);

    // A entidade guarda a aplicação em dataHora (LocalDateTime); a API trabalha só com a data
    @Mapping(target = "dataHora", expression = "java(request.dataAplicacao().atStartOfDay())")
    RegistroVacina toEntity(VacinaRequest request);

    @Mapping(target = "dataAplicacao", expression = "java(registro.getDataHora().toLocalDate())")
    VacinaResponse toResponse(RegistroVacina registro);

    RegistroMedicamento toEntity(MedicamentoRequest request);

    MedicamentoResponse toResponse(RegistroMedicamento registro);
}
