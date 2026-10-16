package br.com.projeto.controller;

import br.com.projeto.dto.response.MidiaPaginaResponse;
import br.com.projeto.dto.response.MidiaResponse;
import br.com.projeto.service.MidiaService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

// Galeria privada: todos os endpoints exigem token e vínculo com o bebê (conferidos em MidiaService).
// Não há caminho público para os arquivos; copiar o endereço sem o token não dá acesso.
@RestController
@RequestMapping("/bebes/{bebeId}/midias")
@RequiredArgsConstructor
public class MidiaController {

    private final MidiaService midiaService;

    // multipart: arquivo (obrigatório), miniatura (opcional, imagem de um quadro do vídeo), descricao (opcional)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MidiaResponse> enviar(@PathVariable Long bebeId,
                                                @RequestPart("arquivo") MultipartFile arquivo,
                                                @RequestPart(value = "miniatura", required = false) MultipartFile miniatura,
                                                @RequestParam(value = "descricao", required = false) String descricao) {
        return ResponseEntity.status(HttpStatus.CREATED).body(midiaService.enviar(bebeId, arquivo, miniatura, descricao));
    }

    // Mais recentes primeiro. ?pagina=0&tamanho=12 (máximo 30 por página)
    @GetMapping
    public ResponseEntity<MidiaPaginaResponse> listar(@PathVariable Long bebeId,
                                                      @RequestParam(defaultValue = "0") int pagina,
                                                      @RequestParam(defaultValue = "12") int tamanho) {
        return ResponseEntity.ok(midiaService.listar(bebeId, pagina, tamanho));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MidiaResponse> obter(@PathVariable Long bebeId, @PathVariable Long id) {
        return ResponseEntity.ok(midiaService.obter(bebeId, id));
    }

    @GetMapping("/{id}/miniatura")
    public ResponseEntity<Resource> miniatura(@PathVariable Long bebeId, @PathVariable Long id) {
        return servir(midiaService.miniatura(bebeId, id));
    }

    // Arquivo original (vídeos: baixados só quando o usuário pede para assistir). Aceita Range.
    @GetMapping("/{id}/arquivo")
    public ResponseEntity<Resource> arquivo(@PathVariable Long bebeId, @PathVariable Long id) {
        return servir(midiaService.arquivo(bebeId, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long bebeId, @PathVariable Long id) {
        midiaService.excluir(bebeId, id);
        return ResponseEntity.noContent().build();
    }

    private static ResponseEntity<Resource> servir(MidiaService.ArquivoMidia arquivo) {
        return ResponseEntity.ok()
                .contentType(arquivo.tipo())
                .cacheControl(CacheControl.noStore().cachePrivate())
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(arquivo.nomeDownload()).build().toString())
                .body(new FileSystemResource(arquivo.caminho()));
    }
}
