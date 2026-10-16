package br.com.projeto.service;

import br.com.projeto.Enum.FaixaEtariaEnum;
import br.com.projeto.Enum.TipoUsuarioEnum;
import br.com.projeto.exception.BebeNaoEncontratoException;
import br.com.projeto.exception.RegraNegocioException;
import br.com.projeto.exception.VinculoJaExisteException;
import br.com.projeto.model.autenticacao.Bebe;
import br.com.projeto.model.autenticacao.Usuario;
import br.com.projeto.model.autenticacao.UsuarioBebe;
import br.com.projeto.repository.BebeRepository;
import br.com.projeto.repository.UsuarioBebeRepository;
import br.com.projeto.repository.specification.BebeSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BebeService {

    private final BebeRepository bebeRepository;
    private final BebeSpecification bebeSpecification;
    private final UsuarioBebeRepository usuarioBebeRepository;
    private final UsuarioBebeService usuarioBebeService;

    //salvar novo bebê já vinculado a quem cadastrou (com o papel do tipo da conta)
    @Transactional
    public Bebe cadastrarBebe(Bebe bebe, Usuario criador) {
        String nomeResponsavel = bebe.getNomeResponsavel() == null ? "" : bebe.getNomeResponsavel().trim();

        if (criador.getTipo() == TipoUsuarioEnum.BABA && nomeResponsavel.isEmpty()) {
            throw new RegraNegocioException("Informe o nome do responsável pelo bebê.");
        }
        if (nomeResponsavel.isEmpty()) {
            nomeResponsavel = criador.getNome(); // o próprio responsável está cadastrando
        }
        bebe.setNomeResponsavel(nomeResponsavel);
        bebe.setNome(bebe.getNome().trim());

        if (usuarioBebeRepository.existsByUsuarioIdAndBebe_NomeIgnoreCaseAndBebe_DataNascimento(
                criador.getId(), bebe.getNome(), bebe.getDataNascimento())) {
            throw new VinculoJaExisteException("Você já tem um bebê cadastrado com este nome e data de nascimento.");
        }

        bebeRepository.save(bebe);
        usuarioBebeService.vincularUsuarioAoBebe(criador.getId(), bebe.getId(), criador.getTipo());
        return bebe;
    }

    //obter informações de um bebê
    public Bebe obterInfoBebe(Long id) {
        return bebeRepository.findById(id)
                .orElseThrow(() -> new BebeNaoEncontratoException("Bebê não encontrado"));
    }

    //bebês aos quais o usuário tem acesso (como responsável ou babá)
    @Transactional(readOnly = true)
    public List<UsuarioBebe> listarBebesDoUsuario(Long usuarioId) {
        return usuarioBebeRepository.findByUsuarioIdComBebe(usuarioId);
    }

    //deletar bebe
    public void deletarBebe(Long id) {
        bebeRepository.findById(id)
                .orElseThrow(() -> new BebeNaoEncontratoException("Bebê não encontrado"));
        bebeRepository.deleteById(id);
    }

    //buscar bebes que sao responsabilidade da baba(buscando por id, nomeBebe, nomeResponsavel, idadeBebe)
    public Page<Bebe> buscarBebesDaBaba(Pageable pageable,
                                        String nomeBebe,
                                        String nomeResponsavel,
                                        FaixaEtariaEnum faixaEtaria,
                                        Long idBebe,
                                        Long idBaba) {
        if (idBaba == null) {
            throw new IllegalArgumentException("ID da babá é obrigatório.");
        }

        Specification<Bebe> spec = bebeSpecification.bebesDaBaba(idBaba);

        // Filtro por ID bebe
        if (idBebe != null) {
            spec = spec.and(bebeSpecification.procurarPorId(idBebe));
        }

        // Filtro por nome do bebê
        if (nomeBebe != null && !nomeBebe.isBlank()) {
            spec = spec.and(bebeSpecification.procurarBebePorNome(nomeBebe));
        }

        // Filtro por nome do responsável
        if (nomeResponsavel != null && !nomeResponsavel.isBlank()) {
            spec = spec.and(bebeSpecification.procurarBebePorNomeResponsavel(nomeResponsavel));
        }

        // Filtro por faixa etária
        if (faixaEtaria != null) {
            spec = spec.and(bebeSpecification.procurarPorFaixaEtaria(faixaEtaria));
        }
        return bebeRepository.findAll(spec, pageable);
    }
}
