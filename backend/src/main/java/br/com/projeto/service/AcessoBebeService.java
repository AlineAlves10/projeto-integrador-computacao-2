package br.com.projeto.service;

import br.com.projeto.exception.AcessoNegadoException;
import br.com.projeto.exception.CredenciaisInvalidasException;
import br.com.projeto.model.autenticacao.Bebe;
import br.com.projeto.model.autenticacao.Usuario;
import br.com.projeto.model.autenticacao.UsuarioBebe;
import br.com.projeto.model.autenticacao.UsuarioBebeId;
import br.com.projeto.repository.UsuarioBebeRepository;
import br.com.projeto.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

// Autorização por vínculo: um usuário só acessa bebês aos quais está vinculado (usuarios_bebes).
// Todo endpoint que recebe o id de um bebê passa por aqui; o id enviado pelo cliente nunca é aceito sem essa checagem.
@Service
@RequiredArgsConstructor
public class AcessoBebeService {

    // Mesma mensagem para bebê inexistente e sem vínculo, para não revelar quais ids existem
    private static final String MENSAGEM_SEM_ACESSO = "Você não tem acesso a este bebê.";

    private final UsuarioBebeRepository usuarioBebeRepository;
    private final UsuarioRepository usuarioRepository;

    public Long usuarioLogadoId() {
        Authentication autenticacao = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacao == null || !(autenticacao.getPrincipal() instanceof Long id)) {
            throw new CredenciaisInvalidasException("Sessão expirada ou não autenticada. Faça login novamente.");
        }
        return id;
    }

    public Usuario usuarioLogado() {
        return usuarioRepository.findById(usuarioLogadoId())
                .orElseThrow(() -> new CredenciaisInvalidasException("Usuário da sessão não existe mais. Faça login novamente."));
    }

    // Retorna o vínculo do usuário logado com o bebê ou lança 403
    public UsuarioBebe verificarAcesso(Long bebeId) {
        return usuarioBebeRepository.findById(new UsuarioBebeId(usuarioLogadoId(), bebeId))
                .orElseThrow(() -> new AcessoNegadoException(MENSAGEM_SEM_ACESSO));
    }

    public Bebe bebeAutorizado(Long bebeId) {
        return verificarAcesso(bebeId).getBebe();
    }

    public void verificarProprioUsuario(Long usuarioId) {
        if (!usuarioLogadoId().equals(usuarioId)) {
            throw new AcessoNegadoException("Operação permitida apenas para o próprio usuário.");
        }
    }

    // O próprio usuário ou alguém que compartilha um bebê com ele
    public void verificarAcessoAoUsuario(Long usuarioId) {
        Long logado = usuarioLogadoId();
        if (!logado.equals(usuarioId) && !usuarioBebeRepository.compartilhamBebe(logado, usuarioId)) {
            throw new AcessoNegadoException("Você não tem acesso aos dados deste usuário.");
        }
    }
}
