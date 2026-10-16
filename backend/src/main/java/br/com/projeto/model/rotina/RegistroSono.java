package br.com.projeto.model.rotina;

import br.com.projeto.model.autenticacao.Bebe;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "registros_sono")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegistroSono {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bebe_id", nullable = false)
    private Bebe bebe;

    @Column(nullable = false)
    private LocalDateTime inicio;

    // Nulo enquanto o bebê ainda está dormindo
    private LocalDateTime fim;

    private Integer duracaoMinutos; // calculado a partir de inicio/fim
    private String local;
}
