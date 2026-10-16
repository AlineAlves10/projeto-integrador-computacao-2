package br.com.projeto.model.diario;

import br.com.projeto.Enum.TagDiarioEnum;
import br.com.projeto.model.autenticacao.Usuario;

import br.com.projeto.model.autenticacao.Bebe;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "diario_notas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DiarioNotas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bebe_id", nullable = false)
    private Bebe bebe;

    @Column(nullable = false)
    private LocalDateTime dataHora;

    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String texto;

    @Enumerated(EnumType.STRING)
    private TagDiarioEnum tag;

    // Usuário que escreveu a anotação
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autor_id")
    private Usuario autor;

    private LocalDateTime atualizadoEm;
}
