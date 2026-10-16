package br.com.projeto.controller;

import br.com.projeto.dto.request.UsuarioBebeRequest;
import br.com.projeto.dto.response.ContatosBebeResponse;
import br.com.projeto.dto.response.UsuarioBebeResponse;
import br.com.projeto.mapper.UsuarioBebeMapper;
import br.com.projeto.model.autenticacao.UsuarioBebe;
import br.com.projeto.service.AcessoBebeService;
import br.com.projeto.service.UsuarioBebeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Vínculos entre usuários e bebês. As permissões ficam em UsuarioBebeService (não dependem do front-end).
@RestController
@RequiredArgsConstructor
public class UsuarioBebeController {

    private final UsuarioBebeService usuarioBebeService;
    private final UsuarioBebeMapper mapper;
    private final AcessoBebeService acessoBebeService;

    // Corpo: { "email": "pessoa@email.com" } (ou usuarioId). Apenas quem gerencia o bebê pode vincular.
    @PostMapping("/bebes/{bebeId}/usuarios")
    public ResponseEntity<UsuarioBebeResponse> vincularUsuarioAoBebe(
            @PathVariable Long bebeId,
            @RequestBody @Valid UsuarioBebeRequest request) {

        UsuarioBebe vinculo = usuarioBebeService.vincularComAutorizacao(bebeId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(vinculo));
    }

    @GetMapping("/bebes/{bebeId}/usuarios")
    public ResponseEntity<List<UsuarioBebeResponse>> listarUsuariosDoBebe(@PathVariable Long bebeId) {
        acessoBebeService.verificarAcesso(bebeId);
        List<UsuarioBebe> usuarios = usuarioBebeService.listarUsuariosDoBebe(bebeId);
        List<UsuarioBebeResponse> resp = mapper.toResponseList(usuarios);
        return ResponseEntity.ok(resp);
    }

    // Pessoas vinculadas com nome, papel e (quando permitido) telefone e links de contato
    @GetMapping("/bebes/{bebeId}/contatos")
    public ResponseEntity<ContatosBebeResponse> listarContatos(@PathVariable Long bebeId) {
        return ResponseEntity.ok(usuarioBebeService.contatos(bebeId));
    }

    @GetMapping("/bebes/{bebeId}/usuarios/{usuarioId}")
    public ResponseEntity<UsuarioBebeResponse> obterVinculo(
            @PathVariable Long bebeId,
            @PathVariable Long usuarioId) {

        acessoBebeService.verificarAcesso(bebeId);
        UsuarioBebe vinculo = usuarioBebeService.obterVinculo(usuarioId, bebeId);
        return ResponseEntity.ok(mapper.toResponse(vinculo));
    }

    // Próprio vínculo (sair) ou responsável removendo babá; demais casos são recusados no serviço
    @DeleteMapping("/bebes/{bebeId}/usuarios/{usuarioId}")
    public ResponseEntity<Void> removerVinculo(
            @PathVariable Long bebeId,
            @PathVariable Long usuarioId) {

        usuarioBebeService.removerComAutorizacao(bebeId, usuarioId);
        return ResponseEntity.noContent().build();
    }
}
