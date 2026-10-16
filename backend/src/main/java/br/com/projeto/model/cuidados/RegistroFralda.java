package br.com.projeto.model.cuidados;

import br.com.projeto.Enum.TipoFraldaEnum;

import br.com.projeto.model.autenticacao.Bebe;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "registros_fralda")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegistroFralda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bebe_id", nullable = false)
    private Bebe bebe;

    @Column(nullable = false)
    private LocalDateTime dataHora;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoFraldaEnum tipo;

    // Novos registros gravam o nome de ConsistenciaFezesEnum; registros antigos podem ter texto livre
    private String consistenciaCoco;
    private String corCoco;
    private String observacoes;

    public boolean temXixi() {
        return tipo == TipoFraldaEnum.XIXI || tipo == TipoFraldaEnum.MISTO;
    }

    public boolean temCoco() {
        return tipo == TipoFraldaEnum.COCO || tipo == TipoFraldaEnum.MISTO;
    }
}
