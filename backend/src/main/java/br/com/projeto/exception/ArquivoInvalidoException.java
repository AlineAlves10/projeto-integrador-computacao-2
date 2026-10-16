package br.com.projeto.exception;

public class ArquivoInvalidoException extends RuntimeException {
    public ArquivoInvalidoException(String message) {
        super(message);
    }
}
