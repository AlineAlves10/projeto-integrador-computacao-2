package br.com.projeto.service;

import br.com.projeto.exception.RegraNegocioException;

// Telefones brasileiros: aceita qualquer formatação digitada ("(11) 98765-4321", "+55 11 98765 4321"...)
// e grava sempre no formato E.164 (+5511987654321). Celular: DDD + 9 dígitos começando por 9; fixo: DDD + 8 dígitos (2 a 5).
public final class Telefone {

    private Telefone() {
    }

    public static final String MENSAGEM_INVALIDO =
            "Telefone inválido. Informe DDD e número, por exemplo (11) 98765-4321.";

    // null/vazio = sem telefone; inválido lança RegraNegocioException
    public static String normalizar(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        if (!valor.matches("[0-9()+\\-.\\s]+")) {
            throw new RegraNegocioException(MENSAGEM_INVALIDO);
        }
        String digitos = valor.replaceAll("\\D", "");
        if (digitos.startsWith("55") && (digitos.length() == 12 || digitos.length() == 13)) {
            digitos = digitos.substring(2);
        }
        if (!nacionalValido(digitos)) {
            throw new RegraNegocioException(MENSAGEM_INVALIDO);
        }
        return "+55" + digitos;
    }

    private static boolean nacionalValido(String d) {
        if (d.length() != 10 && d.length() != 11) return false;
        if (d.charAt(0) == '0' || d.charAt(1) == '0') return false; // DDD de 11 a 99
        char primeiro = d.charAt(2);
        return d.length() == 11 ? primeiro == '9' : primeiro >= '2' && primeiro <= '5';
    }

    // Número nacional (DDD + número) de um valor gravado em E.164; null para valores fora do padrão (dados antigos)
    private static String nacional(String gravado) {
        if (gravado == null || !gravado.matches("\\+55\\d{10,11}")) return null;
        String d = gravado.substring(3);
        return nacionalValido(d) ? d : null;
    }

    // "(11) 98765-4321"; valores antigos fora do padrão são exibidos como estão
    public static String formatar(String gravado) {
        String d = nacional(gravado);
        if (d == null) return gravado;
        String numero = d.substring(2);
        int corte = numero.length() - 4;
        return "(" + d.substring(0, 2) + ") " + numero.substring(0, corte) + "-" + numero.substring(corte);
    }

    public static String linkLigacao(String gravado) {
        return nacional(gravado) == null ? null : "tel:" + gravado;
    }

    // WhatsApp apenas para celulares
    public static String linkWhatsapp(String gravado) {
        String d = nacional(gravado);
        return d == null || d.length() != 11 ? null : "https://wa.me/55" + d;
    }
}
