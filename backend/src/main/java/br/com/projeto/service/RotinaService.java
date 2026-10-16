package br.com.projeto.service;

import br.com.projeto.Enum.TipoAlimentacaoEnum;
import br.com.projeto.exception.RegistroNaoEncontradoException;
import br.com.projeto.exception.RegraNegocioException;
import br.com.projeto.model.autenticacao.Bebe;
import br.com.projeto.model.cuidados.RegistroFralda;
import br.com.projeto.model.cuidados.RegistroHigiene;
import br.com.projeto.model.rotina.RegistroAlimentacao;
import br.com.projeto.model.rotina.RegistroAtividade;
import br.com.projeto.model.rotina.RegistroSono;
import br.com.projeto.repository.RegistroAlimentacaoRepository;
import br.com.projeto.repository.RegistroAtividadeRepository;
import br.com.projeto.repository.RegistroFraldaRepository;
import br.com.projeto.repository.RegistroHigieneRepository;
import br.com.projeto.repository.RegistroSonoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

// Registros de rotina. Toda operação confere o vínculo do usuário logado com o bebê
// e busca o registro pelo par (id, bebeId), impedindo ler ou apagar registros de outro bebê.
@Service
@RequiredArgsConstructor
@Transactional
public class RotinaService {

    private static final String NAO_ENCONTRADO = "Registro não encontrado para este bebê.";

    private final AcessoBebeService acesso;
    private final RegistroAlimentacaoRepository alimentacaoRepository;
    private final RegistroSonoRepository sonoRepository;
    private final RegistroFraldaRepository fraldaRepository;
    private final RegistroHigieneRepository higieneRepository;
    private final RegistroAtividadeRepository atividadeRepository;

    // ---------- Alimentação ----------

    public RegistroAlimentacao registrarAlimentacao(Long bebeId, RegistroAlimentacao registro) {
        Bebe bebe = acesso.bebeAutorizado(bebeId);
        PeriodoConsulta.validarNaoFuturo(registro.getDataHora());

        switch (registro.getTipo()) {
            case PEITO -> {
                if (registro.getLado() == null) {
                    throw new RegraNegocioException("Informe o lado da amamentação.");
                }
            }
            case MAMADEIRA -> {
                if (registro.getTipoLeite() == null) {
                    throw new RegraNegocioException("Informe se a mamadeira é de leite materno ou fórmula.");
                }
            }
            case SOLIDA -> {
                if (registro.getAlimento() == null || registro.getAlimento().isBlank()) {
                    throw new RegraNegocioException("Informe o alimento oferecido.");
                }
            }
        }
        // Cada campo só faz sentido para o seu tipo; valores de outro tipo são descartados
        // para não persistir dados incompatíveis nem distorcer as estatísticas
        if (registro.getTipo() != TipoAlimentacaoEnum.MAMADEIRA) {
            registro.setVolumeMl(null);
            registro.setTipoLeite(null);
        }
        if (registro.getTipo() != TipoAlimentacaoEnum.PEITO) {
            registro.setDuracaoMinutos(null);
            registro.setLado(null);
        }
        if (registro.getTipo() != TipoAlimentacaoEnum.SOLIDA) {
            registro.setAlimento(null);
            registro.setQuantidade(null);
        }

        registro.setBebe(bebe);
        return alimentacaoRepository.save(registro);
    }

    @Transactional(readOnly = true)
    public List<RegistroAlimentacao> listarAlimentacoes(Long bebeId, PeriodoConsulta periodo) {
        acesso.verificarAcesso(bebeId);
        return alimentacaoRepository.findByBebeIdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHora(
                bebeId, periodo.inicio(), periodo.fimExclusivo());
    }

    public void excluirAlimentacao(Long bebeId, Long id) {
        acesso.verificarAcesso(bebeId);
        alimentacaoRepository.delete(alimentacaoRepository.findByIdAndBebeId(id, bebeId)
                .orElseThrow(() -> new RegistroNaoEncontradoException(NAO_ENCONTRADO)));
    }

    // ---------- Sono ----------

    public RegistroSono registrarSono(Long bebeId, RegistroSono registro) {
        Bebe bebe = acesso.bebeAutorizado(bebeId);
        PeriodoConsulta.validarNaoFuturo(registro.getInicio());

        if (registro.getFim() == null && sonoRepository.existsByBebeIdAndFimIsNull(bebeId)) {
            throw new RegraNegocioException("Já existe um sono em andamento. Encerre-o antes de iniciar outro.");
        }
        aplicarFim(registro, registro.getFim());
        registro.setBebe(bebe);
        return sonoRepository.save(registro);
    }

    public RegistroSono encerrarSono(Long bebeId, Long id, LocalDateTime fim) {
        acesso.verificarAcesso(bebeId);
        RegistroSono registro = sonoRepository.findByIdAndBebeId(id, bebeId)
                .orElseThrow(() -> new RegistroNaoEncontradoException(NAO_ENCONTRADO));
        if (registro.getFim() != null) {
            throw new RegraNegocioException("Este período de sono já foi encerrado.");
        }
        aplicarFim(registro, fim);
        return registro;
    }

    private void aplicarFim(RegistroSono registro, LocalDateTime fim) {
        registro.setFim(fim);
        registro.setDuracaoMinutos(null);
        if (fim == null) {
            return;
        }
        PeriodoConsulta.validarNaoFuturo(fim);
        if (!fim.isAfter(registro.getInicio())) {
            throw new RegraNegocioException("O fim do sono deve ser posterior ao início.");
        }
        registro.setDuracaoMinutos((int) Duration.between(registro.getInicio(), fim).toMinutes());
    }

    @Transactional(readOnly = true)
    public List<RegistroSono> listarSonos(Long bebeId, PeriodoConsulta periodo) {
        acesso.verificarAcesso(bebeId);
        return sonoRepository.findByBebeIdAndInicioGreaterThanEqualAndInicioLessThanOrderByInicio(
                bebeId, periodo.inicio(), periodo.fimExclusivo());
    }

    public void excluirSono(Long bebeId, Long id) {
        acesso.verificarAcesso(bebeId);
        sonoRepository.delete(sonoRepository.findByIdAndBebeId(id, bebeId)
                .orElseThrow(() -> new RegistroNaoEncontradoException(NAO_ENCONTRADO)));
    }

    // ---------- Fralda ----------

    public RegistroFralda registrarFralda(Long bebeId, RegistroFralda registro) {
        Bebe bebe = acesso.bebeAutorizado(bebeId);
        PeriodoConsulta.validarNaoFuturo(registro.getDataHora());
        // Características das fezes só se aplicam a trocas com cocô
        if (!registro.temCoco()) {
            registro.setConsistenciaCoco(null);
            registro.setCorCoco(null);
        }
        registro.setBebe(bebe);
        return fraldaRepository.save(registro);
    }

    @Transactional(readOnly = true)
    public List<RegistroFralda> listarFraldas(Long bebeId, PeriodoConsulta periodo) {
        acesso.verificarAcesso(bebeId);
        return fraldaRepository.findByBebeIdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHora(
                bebeId, periodo.inicio(), periodo.fimExclusivo());
    }

    public void excluirFralda(Long bebeId, Long id) {
        acesso.verificarAcesso(bebeId);
        fraldaRepository.delete(fraldaRepository.findByIdAndBebeId(id, bebeId)
                .orElseThrow(() -> new RegistroNaoEncontradoException(NAO_ENCONTRADO)));
    }

    // ---------- Higiene ----------

    public RegistroHigiene registrarHigiene(Long bebeId, RegistroHigiene registro) {
        Bebe bebe = acesso.bebeAutorizado(bebeId);
        PeriodoConsulta.validarNaoFuturo(registro.getDataHora());
        registro.setBebe(bebe);
        return higieneRepository.save(registro);
    }

    @Transactional(readOnly = true)
    public List<RegistroHigiene> listarHigienes(Long bebeId, PeriodoConsulta periodo) {
        acesso.verificarAcesso(bebeId);
        return higieneRepository.findByBebeIdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHora(
                bebeId, periodo.inicio(), periodo.fimExclusivo());
    }

    public void excluirHigiene(Long bebeId, Long id) {
        acesso.verificarAcesso(bebeId);
        higieneRepository.delete(higieneRepository.findByIdAndBebeId(id, bebeId)
                .orElseThrow(() -> new RegistroNaoEncontradoException(NAO_ENCONTRADO)));
    }

    // ---------- Outras atividades ----------

    public RegistroAtividade registrarAtividade(Long bebeId, RegistroAtividade registro) {
        Bebe bebe = acesso.bebeAutorizado(bebeId);
        PeriodoConsulta.validarNaoFuturo(registro.getDataHora());
        registro.setBebe(bebe);
        return atividadeRepository.save(registro);
    }

    @Transactional(readOnly = true)
    public List<RegistroAtividade> listarAtividades(Long bebeId, PeriodoConsulta periodo) {
        acesso.verificarAcesso(bebeId);
        return atividadeRepository.findByBebeIdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHora(
                bebeId, periodo.inicio(), periodo.fimExclusivo());
    }

    public void excluirAtividade(Long bebeId, Long id) {
        acesso.verificarAcesso(bebeId);
        atividadeRepository.delete(atividadeRepository.findByIdAndBebeId(id, bebeId)
                .orElseThrow(() -> new RegistroNaoEncontradoException(NAO_ENCONTRADO)));
    }
}
