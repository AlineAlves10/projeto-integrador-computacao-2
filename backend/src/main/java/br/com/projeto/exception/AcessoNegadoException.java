package br.com.projeto.exception;

public class AcessoNegadoException extends RuntimeException {
    public AcessoNegadoException(String message) {
        super(message);
    }
}
