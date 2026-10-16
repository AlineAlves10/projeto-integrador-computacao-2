package br.com.projeto.controller;

import br.com.projeto.dto.request.DiarioRequest;
import br.com.projeto.dto.response.DiarioResponse;
import br.com.projeto.mapper.DiarioMapper;
import br.com.projeto.service.DiarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bebes/{bebeId}/diario")
@RequiredArgsConstructor
public class DiarioController {

    private final DiarioService diarioService;
    private final DiarioMapper mapper;

    @GetMapping
    public ResponseEntity<List<DiarioResponse>> listar(@PathVariable Long bebeId) {
        return ResponseEntity.ok(diarioService.listar(bebeId).stream().map(mapper::toResponse).toList());
    }

    @PostMapping
    public ResponseEntity<DiarioResponse> criar(@PathVariable Long bebeId, @RequestBody @Valid DiarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(diarioService.criar(bebeId, request)));
    }

    @PutMapping("/{notaId}")
    public ResponseEntity<DiarioResponse> atualizar(@PathVariable Long bebeId, @PathVariable Long notaId,
                                                    @RequestBody @Valid DiarioRequest request) {
        return ResponseEntity.ok(mapper.toResponse(diarioService.atualizar(bebeId, notaId, request)));
    }

    @DeleteMapping("/{notaId}")
    public ResponseEntity<Void> excluir(@PathVariable Long bebeId, @PathVariable Long notaId) {
        diarioService.excluir(bebeId, notaId);
        return ResponseEntity.noContent().build();
    }
}
