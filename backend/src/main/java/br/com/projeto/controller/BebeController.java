package br.com.projeto.controller;

import br.com.projeto.Enum.FaixaEtariaEnum;
import br.com.projeto.dto.request.BebeRequest;
import br.com.projeto.dto.response.BebeResponse;
import br.com.projeto.dto.response.BebeVinculadoResponse;
import br.com.projeto.mapper.BebeMapper;
import br.com.projeto.model.autenticacao.Bebe;
import br.com.projeto.service.AcessoBebeService;
import br.com.projeto.service.BebeService;
import br.com.projeto.service.FotoBebeService;
import br.com.projeto.service.UsuarioBebeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/bebes")
@RequiredArgsConstructor
public class BebeController {

    private final BebeService bebeService;

    private final BebeMapper bebeMapper;

    private final AcessoBebeService acessoBebeService;

    private final FotoBebeService fotoBebeService;

    private final UsuarioBebeService usuarioBebeService;

    // Cria o bebê já vinculado ao usuário logado (papel = tipo da conta). Babás devem informar nomeResponsavel.
    @PostMapping
    public ResponseEntity<BebeResponse> cadastrarBebe(@RequestBody @Valid BebeRequest bebe) {
        final var bebeSalvo = bebeService.cadastrarBebe(bebeMapper.map(bebe), acessoBebeService.usuarioLogado());

        final var response = bebeMapper.map(bebeSalvo);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Bebês aos quais o usuário logado tem acesso (responsável ou babá)
    @GetMapping("/meus")
    public ResponseEntity<List<BebeVinculadoResponse>> listarMeusBebes() {
        List<BebeVinculadoResponse> response = bebeService.listarBebesDoUsuario(acessoBebeService.usuarioLogadoId())
                .stream()
                .map(v -> new BebeVinculadoResponse(bebeMapper.map(v.getBebe()), v.getPapel()))
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BebeResponse> obterBebe(@PathVariable Long id) {
        final var bebe = acessoBebeService.bebeAutorizado(id);
        final var response = bebeMapper.map(bebe);
        return ResponseEntity.ok(response);
    }

    // Apenas quem gerencia o bebê (responsável; ou a babá, se não houver responsável vinculado)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarBebe(@PathVariable Long id) {
        usuarioBebeService.verificarGestor(id);
        bebeService.deletarBebe(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/baba/{idBaba}")
    public ResponseEntity<Page<BebeResponse>> buscarBebesDaBaba(
            @PathVariable Long idBaba,
            @RequestParam(required = false) String nomeBebe,
            @RequestParam(required = false) String nomeResponsavel,
            @RequestParam(required = false) FaixaEtariaEnum faixaEtaria,
            @RequestParam(required = false) Long idBebe,
            Pageable pageable) {

        // Uma babá só pode consultar a própria lista
        acessoBebeService.verificarProprioUsuario(idBaba);

        Page<Bebe> bebes = bebeService.buscarBebesDaBaba(
                pageable,
                nomeBebe,
                nomeResponsavel,
                faixaEtaria,
                idBebe,
                idBaba
        );

        Page<BebeResponse> responsePage = bebes.map(bebeMapper::map);
        return ResponseEntity.ok(responsePage);
    }

    // ---------- Foto de perfil ----------

    @PutMapping(value = "/{id}/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BebeResponse> enviarFoto(@PathVariable Long id, @RequestPart("arquivo") MultipartFile arquivo) {
        Bebe bebe = acessoBebeService.bebeAutorizado(id);
        return ResponseEntity.ok(bebeMapper.map(fotoBebeService.salvar(bebe, arquivo)));
    }

    @GetMapping("/{id}/foto")
    public ResponseEntity<byte[]> obterFoto(@PathVariable Long id) {
        Bebe bebe = acessoBebeService.bebeAutorizado(id);
        return fotoBebeService.carregar(bebe)
                .map(foto -> ResponseEntity.ok()
                        .contentType(foto.tipo())
                        .cacheControl(CacheControl.noStore().cachePrivate())
                        .body(foto.conteudo()))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}/foto")
    public ResponseEntity<Void> removerFoto(@PathVariable Long id) {
        fotoBebeService.remover(acessoBebeService.bebeAutorizado(id));
        return ResponseEntity.noContent().build();
    }
}
