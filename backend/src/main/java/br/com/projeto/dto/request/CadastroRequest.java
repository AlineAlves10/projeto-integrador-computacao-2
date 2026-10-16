package br.com.projeto.dto.request;

import br.com.projeto.Enum.TipoUsuarioEnum;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

// Cadastro da conta e, para responsáveis, de um ou mais bebês na mesma transação
public record CadastroRequest(@NotBlank @Size(max = 120) String nome,
                              @NotBlank @Email @Size(max = 150) String email,
                              @NotBlank @Size(min = 6, max = 72) String senha,
                              @Size(max = 25) String telefone, // opcional; validado e normalizado em Telefone
                              @NotNull TipoUsuarioEnum tipo,
                              @Size(max = 10) List<@Valid @NotNull BebeRequest> bebes) {
}
