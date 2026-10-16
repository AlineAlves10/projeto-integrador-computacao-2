package br.com.projeto.model.cuidados;

import br.com.projeto.Enum.TipoHigieneEnum;

import br.com.projeto.model.autenticacao.Bebe;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "registros_higiene")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegistroHigiene {

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
    private TipoHigieneEnum tipo;

    private String observacoes;
}
