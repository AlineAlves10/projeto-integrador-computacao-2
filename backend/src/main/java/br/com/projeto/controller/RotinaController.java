package br.com.projeto.controller;

import br.com.projeto.dto.request.AlimentacaoRequest;
import br.com.projeto.dto.request.AtividadeRequest;
import br.com.projeto.dto.request.FraldaRequest;
import br.com.projeto.dto.request.HigieneRequest;
import br.com.projeto.dto.request.SonoFimRequest;
import br.com.projeto.dto.request.SonoRequest;
import br.com.projeto.dto.response.AlimentacaoResponse;
import br.com.projeto.dto.response.AtividadeResponse;
import br.com.projeto.dto.response.FraldaResponse;
import br.com.projeto.dto.response.HigieneResponse;
import br.com.projeto.dto.response.SonoResponse;
import br.com.projeto.mapper.RotinaMapper;
import br.com.projeto.service.PeriodoConsulta;
import br.com.projeto.service.RotinaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

// Registros de rotina do bebê. Listagens aceitam ?inicio=yyyy-MM-dd&fim=yyyy-MM-dd (padrão: hoje).
@RestController
@RequestMapping("/bebes/{bebeId}")
@RequiredArgsConstructor
public class RotinaController {

    private final RotinaService rotinaService;
    private final RotinaMapper mapper;

    // ---------- Alimentação ----------

    @PostMapping("/alimentacoes")
    public ResponseEntity<AlimentacaoResponse> registrarAlimentacao(@PathVariable Long bebeId,
                                                                    @RequestBody @Valid AlimentacaoRequest request) {
        var salvo = rotinaService.registrarAlimentacao(bebeId, mapper.toEntity(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(salvo));
    }

    @GetMapping("/alimentacoes")
    public ResponseEntity<List<AlimentacaoResponse>> listarAlimentacoes(
            @PathVariable Long bebeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return ResponseEntity.ok(rotinaService.listarAlimentacoes(bebeId, PeriodoConsulta.de(inicio, fim))
                .stream().map(mapper::toResponse).toList());
    }

    @DeleteMapping("/alimentacoes/{id}")
    public ResponseEntity<Void> excluirAlimentacao(@PathVariable Long bebeId, @PathVariable Long id) {
        rotinaService.excluirAlimentacao(bebeId, id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Sono ----------

    @PostMapping("/sonos")
    public ResponseEntity<SonoResponse> registrarSono(@PathVariable Long bebeId, @RequestBody @Valid SonoRequest request) {
        var salvo = rotinaService.registrarSono(bebeId, mapper.toEntity(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(salvo));
    }

    @PatchMapping("/sonos/{id}/fim")
    public ResponseEntity<SonoResponse> encerrarSono(@PathVariable Long bebeId, @PathVariable Long id,
                                                     @RequestBody @Valid SonoFimRequest request) {
        return ResponseEntity.ok(mapper.toResponse(rotinaService.encerrarSono(bebeId, id, request.fim())));
    }

    @GetMapping("/sonos")
    public ResponseEntity<List<SonoResponse>> listarSonos(
            @PathVariable Long bebeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return ResponseEntity.ok(rotinaService.listarSonos(bebeId, PeriodoConsulta.de(inicio, fim))
                .stream().map(mapper::toResponse).toList());
    }

    @DeleteMapping("/sonos/{id}")
    public ResponseEntity<Void> excluirSono(@PathVariable Long bebeId, @PathVariable Long id) {
        rotinaService.excluirSono(bebeId, id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Fralda ----------

    @PostMapping("/fraldas")
    public ResponseEntity<FraldaResponse> registrarFralda(@PathVariable Long bebeId, @RequestBody @Valid FraldaRequest request) {
        var salvo = rotinaService.registrarFralda(bebeId, mapper.toEntity(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(salvo));
    }

    @GetMapping("/fraldas")
    public ResponseEntity<List<FraldaResponse>> listarFraldas(
            @PathVariable Long bebeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return ResponseEntity.ok(rotinaService.listarFraldas(bebeId, PeriodoConsulta.de(inicio, fim))
                .stream().map(mapper::toResponse).toList());
    }

    @DeleteMapping("/fraldas/{id}")
    public ResponseEntity<Void> excluirFralda(@PathVariable Long bebeId, @PathVariable Long id) {
        rotinaService.excluirFralda(bebeId, id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Higiene ----------

    @PostMapping("/higienes")
    public ResponseEntity<HigieneResponse> registrarHigiene(@PathVariable Long bebeId, @RequestBody @Valid HigieneRequest request) {
        var salvo = rotinaService.registrarHigiene(bebeId, mapper.toEntity(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(salvo));
    }

    @GetMapping("/higienes")
    public ResponseEntity<List<HigieneResponse>> listarHigienes(
            @PathVariable Long bebeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return ResponseEntity.ok(rotinaService.listarHigienes(bebeId, PeriodoConsulta.de(inicio, fim))
                .stream().map(mapper::toResponse).toList());
    }

    @DeleteMapping("/higienes/{id}")
    public ResponseEntity<Void> excluirHigiene(@PathVariable Long bebeId, @PathVariable Long id) {
        rotinaService.excluirHigiene(bebeId, id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Outras atividades (acordou, rituais, brincadeira, passeio, observação) ----------

    @PostMapping("/atividades")
    public ResponseEntity<AtividadeResponse> registrarAtividade(@PathVariable Long bebeId,
                                                                @RequestBody @Valid AtividadeRequest request) {
        var salvo = rotinaService.registrarAtividade(bebeId, mapper.toEntity(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(salvo));
    }

    @GetMapping("/atividades")
    public ResponseEntity<List<AtividadeResponse>> listarAtividades(
            @PathVariable Long bebeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return ResponseEntity.ok(rotinaService.listarAtividades(bebeId, PeriodoConsulta.de(inicio, fim))
                .stream().map(mapper::toResponse).toList());
    }

    @DeleteMapping("/atividades/{id}")
    public ResponseEntity<Void> excluirAtividade(@PathVariable Long bebeId, @PathVariable Long id) {
        rotinaService.excluirAtividade(bebeId, id);
        return ResponseEntity.noContent().build();
    }
}
