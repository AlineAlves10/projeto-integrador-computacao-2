package br.com.projeto.controller;

import br.com.projeto.dto.response.EstatisticasResponse;
import br.com.projeto.dto.response.LinhaDoTempoItemResponse;
import br.com.projeto.dto.response.ResumoDiaResponse;
import br.com.projeto.service.PeriodoConsulta;
import br.com.projeto.service.ResumoService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/bebes/{bebeId}")
@RequiredArgsConstructor
public class ResumoController {

    private final ResumoService resumoService;

    // Todos os registros de rotina e medicamentos do período, em ordem cronológica
    @GetMapping("/linha-do-tempo")
    public ResponseEntity<List<LinhaDoTempoItemResponse>> linhaDoTempo(
            @PathVariable Long bebeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return ResponseEntity.ok(resumoService.linhaDoTempo(bebeId, PeriodoConsulta.de(inicio, fim)));
    }

    @GetMapping("/resumo")
    public ResponseEntity<ResumoDiaResponse> resumo(
            @PathVariable Long bebeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return ResponseEntity.ok(resumoService.resumoDoDia(bebeId, data));
    }

    // Por dia no período (máx. 93 dias) + médias do período e do período anterior de mesmo tamanho
    @GetMapping("/estatisticas")
    public ResponseEntity<EstatisticasResponse> estatisticas(
            @PathVariable Long bebeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return ResponseEntity.ok(resumoService.estatisticas(bebeId, PeriodoConsulta.de(inicio, fim)));
    }
}
