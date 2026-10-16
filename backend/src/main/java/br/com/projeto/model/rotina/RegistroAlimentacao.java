package br.com.projeto.model.rotina;

import br.com.projeto.Enum.LadoAmamentacaoEnum;
import br.com.projeto.Enum.TipoAlimentacaoEnum;
import br.com.projeto.Enum.TipoLeiteEnum;
import br.com.projeto.model.autenticacao.Bebe;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "registro_alimentacao")
public class RegistroAlimentacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "bebe_id", nullable = false)
    private Bebe bebe;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoAlimentacaoEnum tipo;

    private String alimento; // SOLIDA (papinha ou refeição): descrição do alimento

    private LocalDateTime dataHora;
    private String quantidade; // SOLIDA: quantidade consumida em texto livre (ex.: 3 colheres, meio prato)

    private Integer volumeMl; // mamadeira: volume ingerido, usado nas estatísticas

    // MAMADEIRA: leite materno ou fórmula. Nulo em registros antigos, anteriores a essa distinção.
    @Enumerated(EnumType.STRING)
    private TipoLeiteEnum tipoLeite;

    private Integer duracaoMinutos; // peito: duração da mamada

    @Enumerated(EnumType.STRING)
    private LadoAmamentacaoEnum lado;

    private String observacao;
}
