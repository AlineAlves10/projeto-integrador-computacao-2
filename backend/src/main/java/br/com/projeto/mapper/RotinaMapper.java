package br.com.projeto.mapper;

import br.com.projeto.dto.request.AlimentacaoRequest;
import br.com.projeto.dto.request.AtividadeRequest;
import br.com.projeto.dto.request.FraldaRequest;
import br.com.projeto.dto.request.HigieneRequest;
import br.com.projeto.dto.request.SonoRequest;
import br.com.projeto.dto.response.AlimentacaoResponse;
import br.com.projeto.dto.response.AtividadeResponse;
import br.com.projeto.dto.response.FraldaResponse;
import br.com.projeto.dto.response.HigieneResponse;
import br.com.projeto.dto.response.SonoResponse;
import br.com.projeto.model.cuidados.RegistroFralda;
import br.com.projeto.model.cuidados.RegistroHigiene;
import br.com.projeto.model.rotina.RegistroAlimentacao;
import br.com.projeto.model.rotina.RegistroAtividade;
import br.com.projeto.model.rotina.RegistroSono;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface RotinaMapper {

    RegistroAlimentacao toEntity(AlimentacaoRequest request);

    AlimentacaoResponse toResponse(RegistroAlimentacao registro);

    RegistroSono toEntity(SonoRequest request);

    SonoResponse toResponse(RegistroSono registro);

    RegistroFralda toEntity(FraldaRequest request);

    FraldaResponse toResponse(RegistroFralda registro);

    RegistroHigiene toEntity(HigieneRequest request);

    HigieneResponse toResponse(RegistroHigiene registro);

    RegistroAtividade toEntity(AtividadeRequest request);

    AtividadeResponse toResponse(RegistroAtividade registro);
}
