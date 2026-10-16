package br.com.projeto.dto.request;

import br.com.projeto.Enum.TipoUsuarioEnum;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioRequest {

    // Ignorados no cadastro (ver UsuarioMapper); mantidos por compatibilidade com clientes antigos
    private Long id;

    @NotBlank
    @Size(max = 120)
    private String nome;

    @NotBlank
    @Email
    @Size(max = 150)
    private String email;

    @NotBlank
    @Size(min = 6, max = 72)
    private String senha;

    @Size(max = 25) // opcional; validado e normalizado em Telefone
    private String telefone;

    private String fotoPerfil;

    private TipoUsuarioEnum tipo;

    private LocalDate dataCadastro;
}
