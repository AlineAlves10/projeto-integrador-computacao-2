package br.com.projeto.dto.request;

import br.com.projeto.Enum.TipoUsuarioEnum;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Identifica quem será vinculado por e-mail (preferencial) ou id. O papel no vínculo é sempre o tipo da conta
// da pessoa; papel e bebeId são aceitos por compatibilidade e, se enviados, precisam conferir.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioBebeRequest {

    private Long usuarioId;

    @Email
    @Size(max = 150)
    private String email;

    private Long bebeId;

    private TipoUsuarioEnum papel;
}
