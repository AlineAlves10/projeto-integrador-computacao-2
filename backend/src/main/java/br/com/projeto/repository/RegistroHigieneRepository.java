package br.com.projeto.repository;

import br.com.projeto.model.cuidados.RegistroHigiene;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegistroHigieneRepository extends JpaRepository<RegistroHigiene, Long> {

    List<RegistroHigiene> findByBebeIdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHora(
            Long bebeId, LocalDateTime inicio, LocalDateTime fim);

    Optional<RegistroHigiene> findByIdAndBebeId(Long id, Long bebeId);
}
