package br.com.projeto.controller;

import br.com.projeto.dto.request.TelefoneRequest;
import br.com.projeto.dto.request.UsuarioRequest;
import br.com.projeto.dto.response.UsuarioResponse;
import br.com.projeto.mapper.UsuarioMapper;
import br.com.projeto.model.autenticacao.Usuario;
import br.com.projeto.service.AcessoBebeService;
import br.com.projeto.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// A antiga busca GET /usuarios/email foi removida: devolvia telefone e dados de qualquer conta a qualquer usuário logado.
// Para vincular alguém, o responsável informa o e-mail diretamente em POST /bebes/{bebeId}/usuarios.
@RestController
@RequiredArgsConstructor
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final UsuarioMapper mapper;
    private final AcessoBebeService acessoBebeService;

    @PostMapping
    public ResponseEntity<UsuarioResponse> cadastrarUsuario(
            @RequestBody @Valid UsuarioRequest request) {

        Usuario usuario = mapper.toEntity(request);
        Usuario criado = usuarioService.cadastrarUsuario(usuario);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(mapper.toResponse(criado));
    }

    // Dados completos da própria conta
    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> obterProprio() {
        return ResponseEntity.ok(mapper.toResponse(acessoBebeService.usuarioLogado()));
    }

    // Telefone de contato da própria conta (vazio remove)
    @PutMapping("/me/telefone")
    public ResponseEntity<UsuarioResponse> atualizarTelefone(@RequestBody @Valid TelefoneRequest request) {
        Usuario atualizado = usuarioService.atualizarTelefone(acessoBebeService.usuarioLogadoId(), request.telefone());
        return ResponseEntity.ok(mapper.toResponse(atualizado));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponse> obterUsuario(@PathVariable Long id) {

        acessoBebeService.verificarAcessoAoUsuario(id);
        Usuario usuario = usuarioService.obterUsuario(id);

        return ResponseEntity.ok(paraVisualizador(usuario));
    }

    // Sem papel de administrador no sistema: lista apenas o próprio usuário e quem compartilha bebês com ele
    @GetMapping
    public ResponseEntity<List<UsuarioResponse>> listarTodos() {

        List<Usuario> usuarios = usuarioService.listarRelacionados(acessoBebeService.usuarioLogadoId());

        return ResponseEntity.ok(usuarios.stream().map(this::paraVisualizador).toList());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarUsuario(@PathVariable Long id) {

        acessoBebeService.verificarProprioUsuario(id);
        usuarioService.deletarUsuario(id);

        return ResponseEntity.noContent().build();
    }

    // Própria conta: dados completos. Outra pessoa vinculada: nome, tipo e telefone somente se permitido.
    private UsuarioResponse paraVisualizador(Usuario usuario) {
        Long logado = acessoBebeService.usuarioLogadoId();
        if (logado.equals(usuario.getId())) {
            return mapper.toResponse(usuario);
        }
        UsuarioResponse resumo = new UsuarioResponse();
        resumo.setId(usuario.getId());
        resumo.setNome(usuario.getNome());
        resumo.setTipo(usuario.getTipo());
        if (usuarioService.podeVerTelefone(logado, usuario.getId())) {
            resumo.setTelefone(usuario.getTelefone());
        }
        return resumo;
    }
}
