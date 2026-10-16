package br.com.projeto.service;

import br.com.projeto.exception.RegistroNaoEncontradoException;
import br.com.projeto.exception.RegraNegocioException;
import br.com.projeto.model.autenticacao.Bebe;
import br.com.projeto.model.crescimento.RegistroCrescimento;
import br.com.projeto.model.saude.RegistroMedicamento;
import br.com.projeto.model.saude.RegistroVacina;
import br.com.projeto.repository.RegistroCrescimentoRepository;
import br.com.projeto.repository.RegistroMedicamentoRepository;
import br.com.projeto.repository.RegistroVacinaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Caderneta de saúde. Cada medição/aplicação é um novo registro: o histórico nunca é sobrescrito.
// Dados sensíveis: acesso apenas por usuários vinculados ao bebê; nada é registrado em log.
@Service
@RequiredArgsConstructor
@Transactional
public class SaudeService {

    private static final String NAO_ENCONTRADO = "Registro não encontrado para este bebê.";

    private final AcessoBebeService acesso;
    private final RegistroCrescimentoRepository crescimentoRepository;
    private final RegistroVacinaRepository vacinaRepository;
    private final RegistroMedicamentoRepository medicamentoRepository;

    // ---------- Biometria ----------

    public RegistroCrescimento registrarCrescimento(Long bebeId, RegistroCrescimento registro) {
        Bebe bebe = acesso.bebeAutorizado(bebeId);
        if (registro.getPesoKg() == null && registro.getAlturaCm() == null && registro.getPerimetroCefalicoCm() == null) {
            throw new RegraNegocioException("Informe ao menos uma medida (peso, altura ou perímetro cefálico).");
        }
        if (registro.getDataRegistro().isBefore(bebe.getDataNascimento())) {
            throw new RegraNegocioException("A data da medição não pode ser anterior ao nascimento.");
        }
        registro.setBebe(bebe);
        return crescimentoRepository.save(registro);
    }

    @Transactional(readOnly = true)
    public List<RegistroCrescimento> listarCrescimentos(Long bebeId) {
        acesso.verificarAcesso(bebeId);
        return crescimentoRepository.findByBebeIdOrderByDataRegistroDescIdDesc(bebeId);
    }

    public void excluirCrescimento(Long bebeId, Long id) {
        acesso.verificarAcesso(bebeId);
        crescimentoRepository.delete(crescimentoRepository.findByIdAndBebeId(id, bebeId)
                .orElseThrow(() -> new RegistroNaoEncontradoException(NAO_ENCONTRADO)));
    }

    // ---------- Vacinas ----------

    public RegistroVacina registrarVacina(Long bebeId, RegistroVacina registro) {
        Bebe bebe = acesso.bebeAutorizado(bebeId);
        if (registro.getProximaDose() != null
                && !registro.getProximaDose().isAfter(registro.getDataHora().toLocalDate())) {
            throw new RegraNegocioException("A próxima dose deve ser posterior à data de aplicação.");
        }
        registro.setBebe(bebe);
        return vacinaRepository.save(registro);
    }

    @Transactional(readOnly = true)
    public List<RegistroVacina> listarVacinas(Long bebeId) {
        acesso.verificarAcesso(bebeId);
        return vacinaRepository.findByBebeIdOrderByDataHoraDesc(bebeId);
    }

    public void excluirVacina(Long bebeId, Long id) {
        acesso.verificarAcesso(bebeId);
        vacinaRepository.delete(vacinaRepository.findByIdAndBebeId(id, bebeId)
                .orElseThrow(() -> new RegistroNaoEncontradoException(NAO_ENCONTRADO)));
    }

    // ---------- Medicamentos (registro de administração) ----------

    public RegistroMedicamento registrarMedicamento(Long bebeId, RegistroMedicamento registro) {
        Bebe bebe = acesso.bebeAutorizado(bebeId);
        PeriodoConsulta.validarNaoFuturo(registro.getDataHora());
        registro.setBebe(bebe);
        return medicamentoRepository.save(registro);
    }

    @Transactional(readOnly = true)
    public List<RegistroMedicamento> listarMedicamentos(Long bebeId) {
        acesso.verificarAcesso(bebeId);
        return medicamentoRepository.findByBebeIdOrderByDataHoraDesc(bebeId);
    }

    public void excluirMedicamento(Long bebeId, Long id) {
        acesso.verificarAcesso(bebeId);
        medicamentoRepository.delete(medicamentoRepository.findByIdAndBebeId(id, bebeId)
                .orElseThrow(() -> new RegistroNaoEncontradoException(NAO_ENCONTRADO)));
    }
}
