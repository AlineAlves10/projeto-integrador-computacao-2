package br.com.projeto.controller;

import br.com.projeto.Enum.StatusHorarioPrevistoEnum;
import br.com.projeto.dto.request.HorarioPrevistoRequest;
import br.com.projeto.dto.request.HorarioStatusRequest;
import br.com.projeto.dto.response.HorarioPrevistoResponse;
import br.com.projeto.mapper.DiarioMapper;
import br.com.projeto.model.agenda.HorarioPrevisto;
import br.com.projeto.service.HorarioPrevistoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/bebes/{bebeId}/horarios-previstos")
@RequiredArgsConstructor
public class HorarioPrevistoController {

    private final HorarioPrevistoService horarioService;
    private final DiarioMapper mapper;

    @PostMapping
    public ResponseEntity<HorarioPrevistoResponse> criar(@PathVariable Long bebeId,
                                                         @RequestBody @Valid HorarioPrevistoRequest request) {
        HorarioPrevisto horario = new HorarioPrevisto();
        horario.setTipo(request.tipo());
        horario.setDataHoraPrevista(request.dataHoraPrevista());
        horario.setDescricao(request.descricao());
        horario.setDetalhes(request.detalhes());
        horario.setLocal(request.local());
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(horarioService.criar(bebeId, horario)));
    }

    // ?status=PENDENTE|CONCLUIDO|CANCELADO (opcional) &desde=yyyy-MM-ddTHH:mm (padrão: início de hoje)
    @GetMapping
    public ResponseEntity<List<HorarioPrevistoResponse>> listar(
            @PathVariable Long bebeId,
            @RequestParam(required = false) StatusHorarioPrevistoEnum status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime desde) {
        return ResponseEntity.ok(horarioService.listar(bebeId, status, desde).stream().map(mapper::toResponse).toList());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<HorarioPrevistoResponse> atualizarStatus(@PathVariable Long bebeId, @PathVariable Long id,
                                                                   @RequestBody @Valid HorarioStatusRequest request) {
        return ResponseEntity.ok(mapper.toResponse(horarioService.atualizarStatus(bebeId, id, request.status())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long bebeId, @PathVariable Long id) {
        horarioService.excluir(bebeId, id);
        return ResponseEntity.noContent().build();
    }
}
