package br.com.projeto.repository;

import br.com.projeto.model.rotina.RegistroAlimentacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegistroAlimentacaoRepository extends JpaRepository<RegistroAlimentacao, Long> {

    List<RegistroAlimentacao> findByBebeIdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHora(
            Long bebeId, LocalDateTime inicio, LocalDateTime fim);

    Optional<RegistroAlimentacao> findByIdAndBebeId(Long id, Long bebeId);
}
