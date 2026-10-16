package br.com.projeto.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private String token;

    private String tipoToken;

    private Instant expiraEm;

    private UsuarioResponse usuario;
}
