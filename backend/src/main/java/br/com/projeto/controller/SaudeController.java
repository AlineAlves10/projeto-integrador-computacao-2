package br.com.projeto.controller;

import br.com.projeto.dto.request.CrescimentoRequest;
import br.com.projeto.dto.request.MedicamentoRequest;
import br.com.projeto.dto.request.VacinaRequest;
import br.com.projeto.dto.response.CrescimentoResponse;
import br.com.projeto.dto.response.MedicamentoResponse;
import br.com.projeto.dto.response.VacinaResponse;
import br.com.projeto.mapper.SaudeMapper;
import br.com.projeto.service.SaudeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Caderneta de saúde: biometria (crescimento), vacinas e medicamentos administrados
@RestController
@RequestMapping("/bebes/{bebeId}")
@RequiredArgsConstructor
public class SaudeController {

    private final SaudeService saudeService;
    private final SaudeMapper mapper;

    @PostMapping("/crescimentos")
    public ResponseEntity<CrescimentoResponse> registrarCrescimento(@PathVariable Long bebeId,
                                                                    @RequestBody @Valid CrescimentoRequest request) {
        var salvo = saudeService.registrarCrescimento(bebeId, mapper.toEntity(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(salvo));
    }

    @GetMapping("/crescimentos")
    public ResponseEntity<List<CrescimentoResponse>> listarCrescimentos(@PathVariable Long bebeId) {
        return ResponseEntity.ok(saudeService.listarCrescimentos(bebeId).stream().map(mapper::toResponse).toList());
    }

    @DeleteMapping("/crescimentos/{id}")
    public ResponseEntity<Void> excluirCrescimento(@PathVariable Long bebeId, @PathVariable Long id) {
        saudeService.excluirCrescimento(bebeId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/vacinas")
    public ResponseEntity<VacinaResponse> registrarVacina(@PathVariable Long bebeId, @RequestBody @Valid VacinaRequest request) {
        var salvo = saudeService.registrarVacina(bebeId, mapper.toEntity(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(salvo));
    }

    @GetMapping("/vacinas")
    public ResponseEntity<List<VacinaResponse>> listarVacinas(@PathVariable Long bebeId) {
        return ResponseEntity.ok(saudeService.listarVacinas(bebeId).stream().map(mapper::toResponse).toList());
    }

    @DeleteMapping("/vacinas/{id}")
    public ResponseEntity<Void> excluirVacina(@PathVariable Long bebeId, @PathVariable Long id) {
        saudeService.excluirVacina(bebeId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/medicamentos")
    public ResponseEntity<MedicamentoResponse> registrarMedicamento(@PathVariable Long bebeId,
                                                                    @RequestBody @Valid MedicamentoRequest request) {
        var salvo = saudeService.registrarMedicamento(bebeId, mapper.toEntity(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(salvo));
    }

    @GetMapping("/medicamentos")
    public ResponseEntity<List<MedicamentoResponse>> listarMedicamentos(@PathVariable Long bebeId) {
        return ResponseEntity.ok(saudeService.listarMedicamentos(bebeId).stream().map(mapper::toResponse).toList());
    }

    @DeleteMapping("/medicamentos/{id}")
    public ResponseEntity<Void> excluirMedicamento(@PathVariable Long bebeId, @PathVariable Long id) {
        saudeService.excluirMedicamento(bebeId, id);
        return ResponseEntity.noContent().build();
    }
}
