package br.com.projeto.exception;

public class RegistroNaoEncontradoException extends RuntimeException {
    public RegistroNaoEncontradoException(String message) {
        super(message);
    }
}
