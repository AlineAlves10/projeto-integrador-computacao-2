package br.com.projeto.service;

import br.com.projeto.exception.ArquivoInvalidoException;
import br.com.projeto.model.autenticacao.Bebe;
import br.com.projeto.repository.BebeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

// Fotos de perfil dos bebês gravadas em disco (app.uploads.dir); o banco guarda apenas o nome do arquivo.
@Slf4j
@Service
public class FotoBebeService {

    public static final long TAMANHO_MAXIMO_BYTES = 5L * 1024 * 1024;

    // Nomes sempre gerados pelo servidor: <uuid>.<extensão>
    private static final Pattern NOME_ARQUIVO = Pattern.compile("^[0-9a-f\\-]{36}\\.(jpg|png|webp)$");

    private final Path diretorio;
    private final BebeRepository bebeRepository;

    public FotoBebeService(@Value("${app.uploads.dir:uploads/fotos-bebes}") String diretorio,
                           BebeRepository bebeRepository) {
        this.diretorio = Paths.get(diretorio).toAbsolutePath().normalize();
        this.bebeRepository = bebeRepository;
        try {
            Files.createDirectories(this.diretorio);
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível criar o diretório de uploads", e);
        }
    }

    public record Foto(byte[] conteudo, MediaType tipo) {
    }

    public static boolean nomeArquivoValido(String nome) {
        return nome != null && NOME_ARQUIVO.matcher(nome).matches();
    }

    @Transactional
    public Bebe salvar(Bebe bebe, MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new ArquivoInvalidoException("Nenhum arquivo foi enviado.");
        }
        if (arquivo.getSize() > TAMANHO_MAXIMO_BYTES) {
            throw new ArquivoInvalidoException("A foto deve ter no máximo 5 MB.");
        }

        byte[] conteudo;
        try (InputStream entrada = arquivo.getInputStream()) {
            conteudo = entrada.readAllBytes();
        } catch (IOException e) {
            throw new ArquivoInvalidoException("Não foi possível ler o arquivo enviado.");
        }

        // O tipo é identificado pelo conteúdo, ignorando nome e Content-Type informados pelo navegador
        String extensao = detectarExtensao(conteudo)
                .orElseThrow(() -> new ArquivoInvalidoException("Formato não suportado. Envie uma imagem JPEG, PNG ou WebP."));

        String nomeNovo = UUID.randomUUID() + "." + extensao;
        try {
            Files.write(resolver(nomeNovo), conteudo, StandardOpenOption.CREATE_NEW);
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao gravar a foto", e);
        }

        String nomeAntigo = bebe.getFotoPerfil();
        bebe.setFotoPerfil(nomeNovo);
        bebeRepository.save(bebe);
        apagarArquivo(nomeAntigo);
        return bebe;
    }

    public Optional<Foto> carregar(Bebe bebe) {
        String nome = bebe.getFotoPerfil();
        if (!nomeArquivoValido(nome)) {
            return Optional.empty();
        }
        Path caminho = resolver(nome);
        if (!Files.isRegularFile(caminho)) {
            return Optional.empty();
        }
        try {
            return Optional.of(new Foto(Files.readAllBytes(caminho), tipoPorExtensao(nome)));
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao ler a foto", e);
        }
    }

    @Transactional
    public void remover(Bebe bebe) {
        String nome = bebe.getFotoPerfil();
        bebe.setFotoPerfil(null);
        bebeRepository.save(bebe);
        apagarArquivo(nome);
    }

    private void apagarArquivo(String nome) {
        if (!nomeArquivoValido(nome)) {
            return;
        }
        try {
            Files.deleteIfExists(resolver(nome));
        } catch (IOException e) {
            log.warn("Não foi possível apagar a foto antiga {}", nome);
        }
    }

    // Garante que o caminho final fique dentro do diretório de uploads
    private Path resolver(String nome) {
        Path caminho = diretorio.resolve(nome).normalize();
        if (!caminho.startsWith(diretorio)) {
            throw new ArquivoInvalidoException("Nome de arquivo inválido.");
        }
        return caminho;
    }

    static Optional<String> detectarExtensao(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return Optional.of("jpg");
        }
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};
        if (b.length >= 8 && Arrays.equals(Arrays.copyOf(b, 8), png)) {
            return Optional.of("png");
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return Optional.of("webp");
        }
        return Optional.empty();
    }

    private static MediaType tipoPorExtensao(String nome) {
        if (nome.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (nome.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
        return MediaType.IMAGE_JPEG;
    }
}
