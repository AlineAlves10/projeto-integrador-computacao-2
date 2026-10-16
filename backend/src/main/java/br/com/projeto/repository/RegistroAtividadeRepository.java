package br.com.projeto.repository;

import br.com.projeto.model.rotina.RegistroAtividade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegistroAtividadeRepository extends JpaRepository<RegistroAtividade, Long> {

    List<RegistroAtividade> findByBebeIdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHora(
            Long bebeId, LocalDateTime inicio, LocalDateTime fim);

    Optional<RegistroAtividade> findByIdAndBebeId(Long id, Long bebeId);
}
