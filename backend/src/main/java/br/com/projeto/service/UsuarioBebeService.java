package br.com.projeto.service;

import br.com.projeto.Enum.TipoUsuarioEnum;
import br.com.projeto.dto.request.UsuarioBebeRequest;
import br.com.projeto.dto.response.ContatoResponse;
import br.com.projeto.dto.response.ContatosBebeResponse;
import br.com.projeto.exception.AcessoNegadoException;
import br.com.projeto.exception.BebeNaoEncontratoException;
import br.com.projeto.exception.RegraNegocioException;
import br.com.projeto.exception.UsuarioNaoEncontradoException;
import br.com.projeto.exception.VinculoJaExisteException;
import br.com.projeto.exception.VinculoNaoEncontrato;
import br.com.projeto.model.autenticacao.Bebe;
import br.com.projeto.model.autenticacao.Usuario;
import br.com.projeto.model.autenticacao.UsuarioBebe;
import br.com.projeto.model.autenticacao.UsuarioBebeId;
import br.com.projeto.repository.BebeRepository;
import br.com.projeto.repository.UsuarioBebeRepository;
import br.com.projeto.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// Regras de vínculo (sempre conferidas aqui, no servidor). O papel considerado é o do vínculo com aquele bebê:
//  - Qualquer vinculado consulta o bebê, registra informações e lista as pessoas vinculadas.
//  - Vincular pessoas: RESPONSAVEL do bebê. Exceção: bebê sem nenhum responsável vinculado (cadastrado por babá),
//    em que a babá vinculada é a única gestora e pode vincular, inclusive o responsável.
//  - Remover o vínculo de outra pessoa: apenas RESPONSAVEL removendo BABA. Babá não remove ninguém além de si;
//    um responsável não remove outro responsável.
//  - Qualquer um pode remover o próprio vínculo (sair), exceto o último responsável e o último usuário do bebê,
//    para que o bebê não fique sem gestor nem inacessível.
@Service
@RequiredArgsConstructor
public class UsuarioBebeService {

    private final AcessoBebeService acesso;

    private final UsuarioBebeRepository usuarioBebeRepository;
    private final BebeRepository bebeRepository;
    private final UsuarioRepository usuarioRepository;

    // Vincula um usuário a um bebê com um papel específico
    public void vincularUsuarioAoBebe(Long usuarioId,
                                      Long bebeId,
                                      TipoUsuarioEnum papel) {

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() ->
                        new UsuarioNaoEncontradoException("Usuário não encontrado"));

        Bebe bebe = bebeRepository.findById(bebeId)
                .orElseThrow(() ->
                        new BebeNaoEncontratoException("Bebê não encontrado"));

        if (usuarioBebeRepository.existsByUsuarioIdAndBebeId(usuarioId, bebeId)) {
            throw new VinculoJaExisteException("Usuário já está vinculado a este bebê");
        }

        UsuarioBebe vinculo = new UsuarioBebe();

        vinculo.setId(new UsuarioBebeId(usuarioId, bebeId));
        vinculo.setUsuario(usuario);
        vinculo.setBebe(bebe);
        vinculo.setPapel(papel);
        vinculo.setDataVinculo(LocalDateTime.now());

        usuarioBebeRepository.save(vinculo);
    }

    // Quem pode vincular pessoas (e excluir o bebê): responsável, ou a babá de um bebê sem responsável
    public boolean podeGerenciar(UsuarioBebe vinculoDoLogado) {
        return vinculoDoLogado.getPapel() == TipoUsuarioEnum.RESPONSAVEL
                || !usuarioBebeRepository.existsByBebeIdAndPapel(vinculoDoLogado.getId().getBebeId(), TipoUsuarioEnum.RESPONSAVEL);
    }

    public void verificarGestor(Long bebeId) {
        if (!podeGerenciar(acesso.verificarAcesso(bebeId))) {
            throw new AcessoNegadoException("Apenas o responsável pelo bebê pode realizar esta operação.");
        }
    }

    // Vínculo solicitado pelo usuário logado; o papel é sempre o tipo da conta de quem é vinculado
    @Transactional
    public UsuarioBebe vincularComAutorizacao(Long bebeId, UsuarioBebeRequest request) {
        if (request.getBebeId() != null && !request.getBebeId().equals(bebeId)) {
            throw new RegraNegocioException("O bebê informado não corresponde ao endereço da requisição.");
        }
        verificarGestor(bebeId);

        // Somente por e-mail: aceitar o id permitiria vincular contas sequenciais (1, 2, 3...) e, com o vínculo,
        // ver nome e telefone de pessoas que o responsável não conhece
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new RegraNegocioException("Informe o e-mail da pessoa a ser vinculada.");
        }
        Usuario alvo = usuarioRepository.findByEmailIgnoreCase(UsuarioService.normalizarEmail(request.getEmail()))
                .orElseThrow(() -> new UsuarioNaoEncontradoException("Nenhum usuário cadastrado com este e-mail."));
        if (request.getUsuarioId() != null && !request.getUsuarioId().equals(alvo.getId())) {
            throw new RegraNegocioException("O usuário informado não corresponde ao e-mail.");
        }
        if (request.getPapel() != null && request.getPapel() != alvo.getTipo()) {
            throw new RegraNegocioException("O papel no vínculo deve ser o tipo da conta da pessoa ("
                    + (alvo.getTipo() == TipoUsuarioEnum.BABA ? "babá" : "responsável") + ").");
        }
        vincularUsuarioAoBebe(alvo.getId(), bebeId, alvo.getTipo());
        return obterVinculo(alvo.getId(), bebeId);
    }

    // O próprio vínculo, ou responsável removendo babá
    private static boolean autorizadoARemover(UsuarioBebe logado, UsuarioBebe alvo) {
        return logado.getId().equals(alvo.getId())
                || (logado.getPapel() == TipoUsuarioEnum.RESPONSAVEL && alvo.getPapel() == TipoUsuarioEnum.BABA);
    }

    // Regra de remoção (ver comentário da classe); usada também para exibir o botão "Remover"
    private String motivoBloqueioRemocao(UsuarioBebe logado, UsuarioBebe alvo) {
        Long bebeId = alvo.getId().getBebeId();
        if (!autorizadoARemover(logado, alvo)) {
            return logado.getPapel() == TipoUsuarioEnum.BABA
                    ? "A babá não pode remover o vínculo de outras pessoas com o bebê."
                    : "Um responsável não pode remover o vínculo de outro responsável.";
        }
        if (usuarioBebeRepository.countByBebeId(bebeId) <= 1) {
            return "Este é o único usuário vinculado ao bebê; o vínculo não pode ser removido.";
        }
        if (alvo.getPapel() == TipoUsuarioEnum.RESPONSAVEL
                && usuarioBebeRepository.countByBebeIdAndPapel(bebeId, TipoUsuarioEnum.RESPONSAVEL) <= 1) {
            return "Você é o único responsável pelo bebê. Vincule outro responsável antes de sair.";
        }
        return null;
    }

    @Transactional
    public void removerComAutorizacao(Long bebeId, Long usuarioId) {
        UsuarioBebe logado = acesso.verificarAcesso(bebeId);
        UsuarioBebe alvo = obterVinculo(usuarioId, bebeId);
        String bloqueio = motivoBloqueioRemocao(logado, alvo);
        if (bloqueio != null) {
            // Sem permissão sobre o vínculo = 403; demais bloqueios são regra de negócio (400)
            throw autorizadoARemover(logado, alvo) ? new RegraNegocioException(bloqueio) : new AcessoNegadoException(bloqueio);
        }
        usuarioBebeRepository.delete(alvo);
    }

    // Pessoas vinculadas ao bebê; telefone apenas quando o usuário logado pode vê-lo
    @Transactional(readOnly = true)
    public ContatosBebeResponse contatos(Long bebeId) {
        UsuarioBebe logado = acesso.verificarAcesso(bebeId);
        List<UsuarioBebe> vinculos = usuarioBebeRepository.findByBebeIdComUsuario(bebeId);
        List<ContatoResponse> contatos = vinculos.stream().map(v -> {
            boolean voce = v.getId().equals(logado.getId());
            boolean verTelefone = voce || logado.getPapel() == TipoUsuarioEnum.RESPONSAVEL
                    || v.getPapel() == TipoUsuarioEnum.RESPONSAVEL;
            String telefone = verTelefone ? v.getUsuario().getTelefone() : null;
            return new ContatoResponse(v.getUsuario().getId(), v.getUsuario().getNome(), v.getPapel(), v.getDataVinculo(),
                    voce, Telefone.formatar(telefone), Telefone.linkLigacao(telefone), Telefone.linkWhatsapp(telefone),
                    motivoBloqueioRemocao(logado, v) == null);
        }).toList();
        return new ContatosBebeResponse(podeGerenciar(logado), contatos);
    }

    // Lista todos os usuários vinculados a um bebê
    public List<UsuarioBebe> listarUsuariosDoBebe(Long bebeId) {

        bebeRepository.findById(bebeId)
                .orElseThrow(() ->
                        new BebeNaoEncontratoException("Bebê não encontrado"));

        return usuarioBebeRepository.findByBebeId(bebeId);
    }

    // Busca um vínculo específico
    public UsuarioBebe obterVinculo(Long usuarioId, Long bebeId) {

        UsuarioBebeId id = new UsuarioBebeId(usuarioId, bebeId);

        return usuarioBebeRepository.findById(id)
                .orElseThrow(() ->
                        new VinculoNaoEncontrato("Vínculo não encontrado"));
    }
}