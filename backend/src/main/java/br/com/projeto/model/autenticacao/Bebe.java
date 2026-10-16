package br.com.projeto.model.autenticacao;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "bebes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Bebe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private LocalDate dataNascimento;

    private String sexo;

    // Nome do arquivo da foto no diretório de uploads (gerado pelo servidor, nunca informado pelo cliente)
    private String fotoPerfil;

    private String observacoes;

    // Obrigatório quando o bebê é cadastrado por uma babá; permite identificar o responsável mesmo sem conta
    @Column(length = 120)
    private String nomeResponsavel;

    @OneToMany(mappedBy = "bebe")
    private List<UsuarioBebe> usuariosBebes;
}
