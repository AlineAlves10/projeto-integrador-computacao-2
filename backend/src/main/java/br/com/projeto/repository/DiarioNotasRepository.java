package br.com.projeto.repository;

import br.com.projeto.model.diario.DiarioNotas;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiarioNotasRepository extends JpaRepository<DiarioNotas, Long> {

    @EntityGraph(attributePaths = "autor")
    List<DiarioNotas> findByBebeIdOrderByDataHoraDescIdDesc(Long bebeId);

    @EntityGraph(attributePaths = "autor")
    List<DiarioNotas> findByBebeIdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHora(
            Long bebeId, LocalDateTime inicio, LocalDateTime fim);

    @EntityGraph(attributePaths = "autor")
    Optional<DiarioNotas> findByIdAndBebeId(Long id, Long bebeId);
}
