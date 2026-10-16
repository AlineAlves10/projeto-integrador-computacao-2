package br.com.projeto.model.galeria;

import br.com.projeto.Enum.TipoMidiaEnum;
import br.com.projeto.model.autenticacao.Bebe;
import br.com.projeto.model.autenticacao.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

// Foto ou vídeo da galeria privada do bebê. Só metadados: os arquivos ficam em disco (app.midias.dir),
// com nomes gerados pelo servidor, e são servidos apenas por endpoints autenticados que conferem o vínculo.
@Entity
@Table(name = "midias_bebe", indexes = @Index(name = "idx_midias_bebe_data", columnList = "bebe_id, data_envio"))
@Getter
@Setter
@NoArgsConstructor
public class MidiaBebe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bebe_id", nullable = false)
    private Bebe bebe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enviado_por_id", nullable = false)
    private Usuario enviadoPor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoMidiaEnum tipo;

    // <uuid>.<extensão>
    @Column(nullable = false, length = 60)
    private String nomeArquivo;

    // <uuid>.jpg; nulo quando não foi possível gerar (ex.: foto WebP ou vídeo enviado sem miniatura)
    @Column(length = 60)
    private String nomeMiniatura;

    @Column(nullable = false, length = 40)
    private String contentType;

    @Column(nullable = false)
    private Long tamanhoBytes;

    @Column(length = 300)
    private String descricao;

    @Column(nullable = false)
    private LocalDateTime dataEnvio;
}
