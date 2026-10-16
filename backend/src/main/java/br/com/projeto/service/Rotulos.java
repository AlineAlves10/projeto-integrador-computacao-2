package br.com.projeto.service;

import br.com.projeto.Enum.ConsistenciaFezesEnum;
import br.com.projeto.Enum.TipoAtividadeEnum;
import br.com.projeto.Enum.TipoHigieneEnum;
import br.com.projeto.model.cuidados.RegistroFralda;
import br.com.projeto.model.rotina.RegistroAlimentacao;
import br.com.projeto.model.rotina.RegistroSono;

import java.util.Arrays;
import java.util.Objects;
import java.util.stream.Collectors;

// Textos em português usados na linha do tempo
final class Rotulos {

    private Rotulos() {
    }

    static String alimentacao(RegistroAlimentacao a) {
        return switch (a.getTipo()) {
            case PEITO -> "Amamentação no peito";
            case MAMADEIRA -> a.getTipoLeite() == null ? "Mamadeira" : switch (a.getTipoLeite()) {
                case LEITE_MATERNO -> "Mamadeira de leite materno";
                case FORMULA -> "Mamadeira de fórmula infantil";
            };
            case SOLIDA -> "Papinha / refeição";
        };
    }

    static String higiene(TipoHigieneEnum tipo) {
        return switch (tipo) {
            case BANHO -> "Banho";
            case ESCOVACAO_DENTES -> "Escovação dos dentes";
            case CORTE_UNHAS -> "Corte de unhas";
            case LAVAGEM_NARIZ -> "Lavagem nasal";
            case TROCA_ROUPA -> "Troca de roupa";
            case OUTRO -> "Higiene";
        };
    }

    static String atividade(TipoAtividadeEnum tipo) {
        return switch (tipo) {
            case ACORDOU -> "Acordou";
            case RITUAL_BOM_DIA -> "Ritual do bom dia";
            case RITUAL_SONO -> "Ritual do sono";
            case BRINCADEIRA -> "Brincadeira";
            case PASSEIO -> "Passeio";
            case OBSERVACAO -> "Observação";
        };
    }

    static String descreverAlimentacao(RegistroAlimentacao a) {
        String lado = a.getLado() == null ? null : switch (a.getLado()) {
            case ESQUERDO -> "Lado esquerdo";
            case DIREITO -> "Lado direito";
            case AMBOS -> "Ambos os lados";
        };
        // Exibe todos os valores preenchidos, inclusive de registros antigos
        return juntar(
                a.getVolumeMl() == null ? null : a.getVolumeMl() + " ml",
                a.getDuracaoMinutos() == null ? null : duracao(a.getDuracaoMinutos()),
                lado, a.getAlimento(), a.getQuantidade(), a.getObservacao());
    }

    static String descreverSono(RegistroSono s) {
        return juntar(s.getFim() == null ? "Em andamento" : duracao(s.getDuracaoMinutos()), s.getLocal());
    }

    static String descreverFralda(RegistroFralda f) {
        String tipo = switch (f.getTipo()) {
            case XIXI -> "Xixi";
            case COCO -> "Cocô";
            case MISTO -> "Xixi e cocô";
            case LIMPA -> "Limpa";
        };
        return juntar(tipo, consistencia(f.getConsistenciaCoco()), f.getCorCoco(), f.getObservacoes());
    }

    // Converte o código da categoria; textos livres de registros antigos são exibidos como estão
    static String consistencia(String valor) {
        if (valor == null) return null;
        try {
            return switch (ConsistenciaFezesEnum.valueOf(valor)) {
                case LIQUIDA -> "Consistência líquida";
                case PASTOSA -> "Consistência pastosa";
                case FIRME -> "Consistência firme";
                case ENDURECIDA -> "Consistência endurecida";
            };
        } catch (IllegalArgumentException e) {
            return valor;
        }
    }

    static String duracao(int minutos) {
        if (minutos < 60) return minutos + " min";
        int h = minutos / 60;
        int m = minutos % 60;
        return m == 0 ? h + "h" : h + "h " + m + "min";
    }

    static String juntar(String... partes) {
        return Arrays.stream(partes)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(p -> !p.isEmpty())
                .collect(Collectors.joining(" • "));
    }
}
