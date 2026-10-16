package br.com.projeto.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BebeNaoEncontratoException.class)
    public ResponseEntity<String> handleBebeNaoEncontratoException(
            BebeNaoEncontratoException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ex.getMessage());
    }

    @ExceptionHandler(UsuarioNaoEncontradoException.class)
    public ResponseEntity<String> handleUsuarioNaoEncontradoException(
            UsuarioNaoEncontradoException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ex.getMessage());
    }

    @ExceptionHandler(VinculoNaoEncontrato.class)
    public ResponseEntity<String> handleVinculoNaoEncontrato(
            VinculoNaoEncontrato ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ex.getMessage());
    }

    @ExceptionHandler(VinculoJaExisteException.class)
    public ResponseEntity<String> handleVinculoJaExiste(
            VinculoJaExisteException ex) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ex.getMessage());
    }

    @ExceptionHandler(RegistroNaoEncontradoException.class)
    public ResponseEntity<String> handleRegistroNaoEncontrado(RegistroNaoEncontradoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(AcessoNegadoException.class)
    public ResponseEntity<String> handleAcessoNegado(AcessoNegadoException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
    }

    @ExceptionHandler(CredenciaisInvalidasException.class)
    public ResponseEntity<String> handleCredenciaisInvalidas(CredenciaisInvalidasException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ex.getMessage());
    }

    @ExceptionHandler(EmailJaCadastradoException.class)
    public ResponseEntity<String> handleEmailJaCadastrado(EmailJaCadastradoException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
    }

    @ExceptionHandler({RegraNegocioException.class, ArquivoInvalidoException.class})
    public ResponseEntity<String> handleRegraNegocio(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

    // Erros de Bean Validation: informa quais campos falharam (ex.: "bebes[1].nome: não deve estar em branco")
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidacao(MethodArgumentNotValidException ex) {
        String detalhes = ex.getBindingResult().getFieldErrors().stream()
                .map(this::formatarErroCampo)
                .sorted()
                .collect(Collectors.joining("; "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Dados inválidos: " + detalhes);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<String> handleValidacaoParametros(HandlerMethodValidationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Parâmetros inválidos na requisição.");
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<String> handleFormatoInvalido(Exception ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Formato de dados inválido. Verifique datas, números e valores selecionados.");
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<String> handleArquivoAusente(MissingServletRequestPartException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Nenhum arquivo foi enviado.");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<String> handleArquivoGrande(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE).body(
                "Arquivo grande demais. Foto de perfil: até 5 MB; fotos da galeria: até 10 MB; vídeos: até 50 MB.");
    }

    // Restrições do banco (e-mail duplicado em corrida, exclusão de bebê com registros vinculados...)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<String> handleIntegridade(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body("Operação não permitida: há registros relacionados ou dados duplicados.");
    }

    private String formatarErroCampo(FieldError erro) {
        return erro.getField() + ": " + erro.getDefaultMessage();
    }
}
