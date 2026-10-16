package br.com.projeto.repository;

import br.com.projeto.model.cuidados.RegistroFralda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegistroFraldaRepository extends JpaRepository<RegistroFralda, Long> {

    List<RegistroFralda> findByBebeIdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHora(
            Long bebeId, LocalDateTime inicio, LocalDateTime fim);

    Optional<RegistroFralda> findByIdAndBebeId(Long id, Long bebeId);
}
