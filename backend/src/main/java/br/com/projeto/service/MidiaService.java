package br.com.projeto.service;

import br.com.projeto.Enum.TipoMidiaEnum;
import br.com.projeto.Enum.TipoUsuarioEnum;
import br.com.projeto.dto.response.MidiaPaginaResponse;
import br.com.projeto.dto.response.MidiaResponse;
import br.com.projeto.exception.AcessoNegadoException;
import br.com.projeto.exception.ArquivoInvalidoException;
import br.com.projeto.exception.RegistroNaoEncontradoException;
import br.com.projeto.model.autenticacao.UsuarioBebe;
import br.com.projeto.model.galeria.MidiaBebe;
import br.com.projeto.repository.MidiaBebeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

// Galeria privada do bebê. Mesmo modelo da foto de perfil (FotoBebeService), em diretório próprio (app.midias.dir):
// arquivos em disco com nome <uuid>.<ext> gerado aqui, tipo identificado pelo conteúdo, banco só com metadados.
// Nenhum arquivo tem URL pública: tudo passa pelos endpoints que conferem o vínculo do usuário com o bebê.
// Exclusão: quem enviou a mídia ou um RESPONSAVEL do bebê.
@Slf4j
@Service
public class MidiaService {

    public static final long MAX_FOTO_BYTES = 10L * 1024 * 1024;
    public static final long MAX_VIDEO_BYTES = 50L * 1024 * 1024;
    public static final long MAX_MINIATURA_BYTES = 2L * 1024 * 1024;
    private static final int LADO_MINIATURA = 320;
    private static final int TAMANHO_PAGINA_MAXIMO = 30;
    private static final long PIXELS_MAXIMOS = 50_000_000L; // evita estourar memória ao decodificar imagens enormes

    private static final Pattern NOME_ARQUIVO = Pattern.compile("^[0-9a-f\\-]{36}\\.(jpg|png|webp|mp4|mov|webm)$");

    // Marcas do contêiner ISO (MP4/MOV) aceitas; exclui HEIC/AVIF (imagens) e M4A (áudio), que usam o mesmo contêiner
    private static final Set<String> MARCAS_VIDEO = Set.of(
            "isom", "iso2", "iso3", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "M4V ", "mmp4", "MSNV", "qt  ");

    private record Formato(TipoMidiaEnum tipo, String extensao, String contentType) {
    }

    public record ArquivoMidia(Path caminho, MediaType tipo, String nomeDownload) {
    }

    private final Path diretorio;
    private final MidiaBebeRepository midiaRepository;
    private final AcessoBebeService acesso;

    public MidiaService(@Value("${app.midias.dir:uploads/midias-bebes}") String diretorio,
                        MidiaBebeRepository midiaRepository,
                        AcessoBebeService acesso) {
        this.diretorio = Paths.get(diretorio).toAbsolutePath().normalize();
        this.midiaRepository = midiaRepository;
        this.acesso = acesso;
        try {
            Files.createDirectories(this.diretorio);
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível criar o diretório da galeria", e);
        }
    }

    // ---------- Envio ----------

    @Transactional
    public MidiaResponse enviar(Long bebeId, MultipartFile arquivo, MultipartFile miniatura, String descricao) {
        UsuarioBebe vinculo = acesso.verificarAcesso(bebeId);
        if (arquivo == null || arquivo.isEmpty()) {
            throw new ArquivoInvalidoException("Nenhum arquivo foi enviado.");
        }
        String descricaoLimpa = descricao == null || descricao.isBlank() ? null : descricao.trim();
        if (descricaoLimpa != null && descricaoLimpa.length() > 300) {
            throw new ArquivoInvalidoException("A descrição deve ter no máximo 300 caracteres.");
        }

        // O tipo vem do conteúdo; nome do arquivo e Content-Type informados pelo navegador são ignorados
        Formato formato = detectar(lerCabecalho(arquivo))
                .orElseThrow(() -> new ArquivoInvalidoException(
                        "Formato não suportado. Envie foto JPEG, PNG ou WebP, ou vídeo MP4, MOV ou WebM."));
        long limite = formato.tipo() == TipoMidiaEnum.FOTO ? MAX_FOTO_BYTES : MAX_VIDEO_BYTES;
        if (arquivo.getSize() > limite) {
            throw new ArquivoInvalidoException(formato.tipo() == TipoMidiaEnum.FOTO
                    ? "A foto deve ter no máximo 10 MB." : "O vídeo deve ter no máximo 50 MB.");
        }

        List<String> gravados = new ArrayList<>();
        try {
            String nome = UUID.randomUUID() + "." + formato.extensao();
            arquivo.transferTo(resolver(nome));
            gravados.add(nome);

            String nomeMiniatura = formato.tipo() == TipoMidiaEnum.FOTO
                    ? miniaturaDaFoto(nome)
                    : miniaturaDoVideo(miniatura);
            if (nomeMiniatura != null) gravados.add(nomeMiniatura);

            MidiaBebe midia = new MidiaBebe();
            midia.setBebe(vinculo.getBebe());
            midia.setEnviadoPor(vinculo.getUsuario());
            midia.setTipo(formato.tipo());
            midia.setNomeArquivo(nome);
            midia.setNomeMiniatura(nomeMiniatura);
            midia.setContentType(formato.contentType());
            midia.setTamanhoBytes(arquivo.getSize());
            midia.setDescricao(descricaoLimpa);
            midia.setDataEnvio(LocalDateTime.now());
            midiaRepository.saveAndFlush(midia);
            return paraResposta(midia, vinculo);
        } catch (IOException e) {
            gravados.forEach(this::apagarArquivo);
            throw new UncheckedIOException("Falha ao gravar a mídia", e);
        } catch (RuntimeException e) {
            gravados.forEach(this::apagarArquivo); // sem registro no banco, nenhum arquivo fica órfão
            throw e;
        }
    }

    private String miniaturaDaFoto(String nomeArquivo) throws IOException {
        try (InputStream entrada = Files.newInputStream(resolver(nomeArquivo))) {
            BufferedImage imagem = lerImagem(entrada);
            return imagem == null ? null : gravarMiniatura(imagem); // ex.: WebP, que o Java não decodifica
        }
    }

    // A miniatura do vídeo é gerada pelo navegador (um quadro do vídeo) e aqui é validada e redesenhada
    private String miniaturaDoVideo(MultipartFile miniatura) throws IOException {
        if (miniatura == null || miniatura.isEmpty()) {
            return null;
        }
        if (miniatura.getSize() > MAX_MINIATURA_BYTES) {
            throw new ArquivoInvalidoException("A miniatura do vídeo deve ter no máximo 2 MB.");
        }
        BufferedImage imagem;
        try (InputStream entrada = miniatura.getInputStream()) {
            byte[] conteudo = entrada.readAllBytes();
            Optional<String> extensao = FotoBebeService.detectarExtensao(conteudo);
            if (extensao.isEmpty() || extensao.get().equals("webp")) {
                throw new ArquivoInvalidoException("A miniatura do vídeo deve ser uma imagem JPEG ou PNG.");
            }
            imagem = lerImagem(new java.io.ByteArrayInputStream(conteudo));
        }
        if (imagem == null) {
            throw new ArquivoInvalidoException("Não foi possível ler a miniatura do vídeo.");
        }
        return gravarMiniatura(imagem);
    }

    // Decodifica só depois de conferir as dimensões no cabeçalho
    private static BufferedImage lerImagem(InputStream entrada) throws IOException {
        try (ImageInputStream iis = ImageIO.createImageInputStream(entrada)) {
            if (iis == null) return null;
            Iterator<ImageReader> leitores = ImageIO.getImageReaders(iis);
            if (!leitores.hasNext()) return null;
            ImageReader leitor = leitores.next();
            try {
                leitor.setInput(iis, true, true);
                if ((long) leitor.getWidth(0) * leitor.getHeight(0) > PIXELS_MAXIMOS) return null;
                return leitor.read(0);
            } catch (IOException | RuntimeException e) {
                return null;
            } finally {
                leitor.dispose();
            }
        }
    }

    // JPEG de até 320 px no maior lado, sem transparência e sem metadados do original (ex.: localização)
    private String gravarMiniatura(BufferedImage original) throws IOException {
        double escala = Math.min(1.0, (double) LADO_MINIATURA / Math.max(original.getWidth(), original.getHeight()));
        int largura = Math.max(1, (int) Math.round(original.getWidth() * escala));
        int altura = Math.max(1, (int) Math.round(original.getHeight() * escala));
        BufferedImage miniatura = new BufferedImage(largura, altura, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = miniatura.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, largura, altura);
            g.drawImage(original, 0, 0, largura, altura, null);
        } finally {
            g.dispose();
        }
        String nome = UUID.randomUUID() + ".jpg";
        if (!ImageIO.write(miniatura, "jpg", resolver(nome).toFile())) {
            return null;
        }
        return nome;
    }

    // ---------- Consulta ----------

    @Transactional(readOnly = true)
    public MidiaPaginaResponse listar(Long bebeId, int pagina, int tamanho) {
        UsuarioBebe vinculo = acesso.verificarAcesso(bebeId);
        int tamanhoValido = Math.max(1, Math.min(tamanho, TAMANHO_PAGINA_MAXIMO));
        Page<MidiaBebe> resultado = midiaRepository.findByBebeIdOrderByDataEnvioDescIdDesc(
                bebeId, PageRequest.of(Math.max(0, pagina), tamanhoValido));
        return new MidiaPaginaResponse(resultado.map(m -> paraResposta(m, vinculo)).getContent(),
                resultado.getNumber(), resultado.getSize(), resultado.getTotalElements(), resultado.getTotalPages());
    }

    @Transactional(readOnly = true)
    public MidiaResponse obter(Long bebeId, Long midiaId) {
        UsuarioBebe vinculo = acesso.verificarAcesso(bebeId);
        return paraResposta(buscar(bebeId, midiaId), vinculo);
    }

    @Transactional(readOnly = true)
    public ArquivoMidia arquivo(Long bebeId, Long midiaId) {
        acesso.verificarAcesso(bebeId);
        MidiaBebe midia = buscar(bebeId, midiaId);
        return new ArquivoMidia(existente(midia.getNomeArquivo()), MediaType.parseMediaType(midia.getContentType()),
                "midia-" + midia.getId() + midia.getNomeArquivo().substring(midia.getNomeArquivo().lastIndexOf('.')));
    }

    // Miniatura JPEG; foto sem miniatura (WebP) usa o próprio arquivo; vídeo sem miniatura = 404
    @Transactional(readOnly = true)
    public ArquivoMidia miniatura(Long bebeId, Long midiaId) {
        acesso.verificarAcesso(bebeId);
        MidiaBebe midia = buscar(bebeId, midiaId);
        if (midia.getNomeMiniatura() != null) {
            return new ArquivoMidia(existente(midia.getNomeMiniatura()), MediaType.IMAGE_JPEG, "miniatura-" + midia.getId() + ".jpg");
        }
        if (midia.getTipo() == TipoMidiaEnum.FOTO) {
            return arquivo(bebeId, midiaId);
        }
        throw new RegistroNaoEncontradoException("Este vídeo não tem miniatura.");
    }

    // ---------- Exclusão ----------

    @Transactional
    public void excluir(Long bebeId, Long midiaId) {
        UsuarioBebe vinculo = acesso.verificarAcesso(bebeId);
        MidiaBebe midia = buscar(bebeId, midiaId);
        if (!podeExcluir(midia, vinculo)) {
            throw new AcessoNegadoException("Apenas quem enviou a mídia ou um responsável pelo bebê pode excluí-la.");
        }
        midiaRepository.delete(midia);
        midiaRepository.flush(); // só apaga os arquivos depois que o registro saiu do banco
        apagarArquivo(midia.getNomeArquivo());
        apagarArquivo(midia.getNomeMiniatura());
    }

    // ---------- Auxiliares ----------

    private static boolean podeExcluir(MidiaBebe midia, UsuarioBebe vinculo) {
        return midia.getEnviadoPor().getId().equals(vinculo.getId().getUsuarioId())
                || vinculo.getPapel() == TipoUsuarioEnum.RESPONSAVEL;
    }

    private MidiaResponse paraResposta(MidiaBebe m, UsuarioBebe vinculo) {
        boolean possuiMiniatura = m.getNomeMiniatura() != null || m.getTipo() == TipoMidiaEnum.FOTO;
        return new MidiaResponse(m.getId(), m.getTipo(), m.getContentType(), m.getTamanhoBytes(), m.getDescricao(),
                m.getDataEnvio(), m.getEnviadoPor().getId(), m.getEnviadoPor().getNome(), possuiMiniatura,
                podeExcluir(m, vinculo));
    }

    private MidiaBebe buscar(Long bebeId, Long midiaId) {
        return midiaRepository.findByIdAndBebeId(midiaId, bebeId)
                .orElseThrow(() -> new RegistroNaoEncontradoException("Mídia não encontrada para este bebê."));
    }

    private Path existente(String nome) {
        if (nome == null || !NOME_ARQUIVO.matcher(nome).matches()) {
            throw new RegistroNaoEncontradoException("Arquivo da mídia não encontrado.");
        }
        Path caminho = resolver(nome);
        if (!Files.isRegularFile(caminho)) {
            throw new RegistroNaoEncontradoException("Arquivo da mídia não encontrado.");
        }
        return caminho;
    }

    private void apagarArquivo(String nome) {
        if (nome == null || !NOME_ARQUIVO.matcher(nome).matches()) return;
        try {
            Files.deleteIfExists(resolver(nome));
        } catch (IOException e) {
            log.warn("Não foi possível apagar o arquivo de mídia {}", nome);
        }
    }

    // Garante que o caminho final fique dentro do diretório da galeria
    private Path resolver(String nome) {
        Path caminho = diretorio.resolve(nome).normalize();
        if (!caminho.startsWith(diretorio)) {
            throw new ArquivoInvalidoException("Nome de arquivo inválido.");
        }
        return caminho;
    }

    private static byte[] lerCabecalho(MultipartFile arquivo) {
        try (InputStream entrada = arquivo.getInputStream()) {
            return entrada.readNBytes(16);
        } catch (IOException e) {
            throw new ArquivoInvalidoException("Não foi possível ler o arquivo enviado.");
        }
    }

    private static Optional<Formato> detectar(byte[] b) {
        Optional<String> imagem = FotoBebeService.detectarExtensao(b);
        if (imagem.isPresent()) {
            String ext = imagem.get();
            String tipo = switch (ext) {
                case "png" -> "image/png";
                case "webp" -> "image/webp";
                default -> "image/jpeg";
            };
            return Optional.of(new Formato(TipoMidiaEnum.FOTO, ext, tipo));
        }
        if (b.length >= 12 && new String(b, 4, 4, StandardCharsets.ISO_8859_1).equals("ftyp")) {
            String marca = new String(b, 8, 4, StandardCharsets.ISO_8859_1);
            if (MARCAS_VIDEO.contains(marca)) {
                return Optional.of(marca.equals("qt  ")
                        ? new Formato(TipoMidiaEnum.VIDEO, "mov", "video/quicktime")
                        : new Formato(TipoMidiaEnum.VIDEO, "mp4", "video/mp4"));
            }
        }
        byte[] ebml = {0x1A, 0x45, (byte) 0xDF, (byte) 0xA3};
        if (b.length >= 4 && Arrays.equals(Arrays.copyOf(b, 4), ebml)) {
            return Optional.of(new Formato(TipoMidiaEnum.VIDEO, "webm", "video/webm"));
        }
        return Optional.empty();
    }
}
