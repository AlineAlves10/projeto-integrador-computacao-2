package br.com.projeto.dto.request;

import jakarta.validation.constraints.Size;

// Vazio ou nulo remove o telefone
public record TelefoneRequest(@Size(max = 25) String telefone) {
}
