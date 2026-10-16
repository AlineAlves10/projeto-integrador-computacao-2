package br.com.projeto.model.agenda;

import br.com.projeto.Enum.StatusHorarioPrevistoEnum;
import br.com.projeto.Enum.TipoHorarioPrevistoEnum;
import br.com.projeto.model.autenticacao.Bebe;
import br.com.projeto.model.autenticacao.Usuario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

// Cuidado planejado (próxima mamada, consulta, remédio...). Concluir um horário NÃO cria um registro de rotina:
// a realização da atividade é registrada separadamente.
@Entity
@Table(name = "horarios_previstos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HorarioPrevisto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bebe_id", nullable = false)
    private Bebe bebe;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoHorarioPrevistoEnum tipo;

    @Column(nullable = false)
    private LocalDateTime dataHoraPrevista;

    // Texto principal, com sentido conforme o tipo: alimento ou leite (ALIMENTACAO), nome do medicamento (MEDICAMENTO),
    // profissional (CONSULTA), vacina (VACINA), tipo de cuidado (BANHO = higiene), rotina de descanso (SONO), livre (OUTRO)
    @Column(length = 300)
    private String descricao;

    // MEDICAMENTO: dose e orientações; CONSULTA: motivo. Nulo nos demais tipos.
    @Column(length = 300)
    private String detalhes;

    // CONSULTA e VACINA: local. Nulo nos demais tipos.
    @Column(length = 150)
    private String local;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusHorarioPrevistoEnum status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criado_por_id")
    private Usuario criadoPor;

    @Column(nullable = false)
    private LocalDateTime dataCriacao;
}
