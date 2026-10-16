package br.com.projeto.model.rotina;

import br.com.projeto.Enum.TipoAtividadeEnum;
import br.com.projeto.model.autenticacao.Bebe;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

// Atividades de rotina sem dados específicos (acordou, rituais, brincadeiras, passeios, observações).
// Alimentação, sono, fralda, higiene e medicamento continuam em suas entidades próprias.
@Entity
@Table(name = "registros_atividade")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegistroAtividade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bebe_id", nullable = false)
    private Bebe bebe;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoAtividadeEnum tipo;

    @Column(nullable = false)
    private LocalDateTime dataHora;

    private Integer duracaoMinutos;

    @Column(length = 500)
    private String descricao;
}
