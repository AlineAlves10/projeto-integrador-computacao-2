package br.com.projeto.service;

import br.com.projeto.Enum.StatusHorarioPrevistoEnum;
import br.com.projeto.Enum.TipoHorarioPrevistoEnum;
import br.com.projeto.exception.RegistroNaoEncontradoException;
import br.com.projeto.exception.RegraNegocioException;
import br.com.projeto.model.agenda.HorarioPrevisto;
import br.com.projeto.model.autenticacao.Bebe;
import br.com.projeto.repository.HorarioPrevistoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class HorarioPrevistoService {

    private static final int LIMITE_LISTAGEM = 50;

    private final AcessoBebeService acesso;
    private final HorarioPrevistoRepository horarioRepository;

    public HorarioPrevisto criar(Long bebeId, HorarioPrevisto horario) {
        Bebe bebe = acesso.bebeAutorizado(bebeId);
        PeriodoConsulta.validarNaoPassado(horario.getDataHoraPrevista());
        ajustarCamposAoTipo(horario);
        horario.setBebe(bebe);
        horario.setStatus(StatusHorarioPrevistoEnum.PENDENTE);
        horario.setCriadoPor(acesso.usuarioLogado());
        horario.setDataCriacao(LocalDateTime.now());
        return horarioRepository.save(horario);
    }

    // Por padrão: pendentes a partir do início de hoje (inclui os atrasados do dia), em ordem cronológica
    @Transactional(readOnly = true)
    public List<HorarioPrevisto> listar(Long bebeId, StatusHorarioPrevistoEnum status, LocalDateTime desde) {
        acesso.verificarAcesso(bebeId);
        LocalDateTime inicio = desde != null ? desde : LocalDateTime.now().toLocalDate().atStartOfDay();
        if (status == null) {
            return horarioRepository.findByBebeIdAndDataHoraPrevistaGreaterThanEqualOrderByDataHoraPrevista(
                    bebeId, inicio, Limit.of(LIMITE_LISTAGEM));
        }
        return horarioRepository.findByBebeIdAndStatusAndDataHoraPrevistaGreaterThanEqualOrderByDataHoraPrevista(
                bebeId, status, inicio, Limit.of(LIMITE_LISTAGEM));
    }

    // Concluir/cancelar não cria registro de rotina: a realização é registrada à parte
    public HorarioPrevisto atualizarStatus(Long bebeId, Long id, StatusHorarioPrevistoEnum novoStatus) {
        HorarioPrevisto horario = buscar(bebeId, id);
        if (novoStatus == StatusHorarioPrevistoEnum.PENDENTE) {
            throw new RegraNegocioException("Informe CONCLUIDO ou CANCELADO.");
        }
        if (horario.getStatus() != StatusHorarioPrevistoEnum.PENDENTE) {
            throw new RegraNegocioException("Apenas horários pendentes podem ser concluídos ou cancelados.");
        }
        horario.setStatus(novoStatus);
        return horario;
    }

    // Cada tipo usa só os campos que fazem sentido para ele; o restante é descartado
    private static void ajustarCamposAoTipo(HorarioPrevisto horario) {
        TipoHorarioPrevistoEnum tipo = horario.getTipo();
        horario.setDescricao(textoOuNulo(horario.getDescricao()));
        horario.setDetalhes(tipo == TipoHorarioPrevistoEnum.MEDICAMENTO || tipo == TipoHorarioPrevistoEnum.CONSULTA
                ? textoOuNulo(horario.getDetalhes()) : null);
        horario.setLocal(tipo == TipoHorarioPrevistoEnum.CONSULTA || tipo == TipoHorarioPrevistoEnum.VACINA
                ? textoOuNulo(horario.getLocal()) : null);

        if (horario.getDescricao() == null) {
            if (tipo == TipoHorarioPrevistoEnum.MEDICAMENTO) {
                throw new RegraNegocioException("Informe o nome do medicamento.");
            }
            if (tipo == TipoHorarioPrevistoEnum.OUTRO) {
                throw new RegraNegocioException("Descreva o horário previsto.");
            }
        }
    }

    private static String textoOuNulo(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }

    public void excluir(Long bebeId, Long id) {
        horarioRepository.delete(buscar(bebeId, id));
    }

    private HorarioPrevisto buscar(Long bebeId, Long id) {
        acesso.verificarAcesso(bebeId);
        return horarioRepository.findByIdAndBebeId(id, bebeId)
                .orElseThrow(() -> new RegistroNaoEncontradoException("Horário não encontrado para este bebê."));
    }
}
