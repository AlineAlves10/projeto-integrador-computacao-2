package br.com.projeto.repository;

import br.com.projeto.model.saude.RegistroVacina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistroVacinaRepository extends JpaRepository<RegistroVacina, Long> {

    List<RegistroVacina> findByBebeIdOrderByDataHoraDesc(Long bebeId);

    Optional<RegistroVacina> findByIdAndBebeId(Long id, Long bebeId);
}
