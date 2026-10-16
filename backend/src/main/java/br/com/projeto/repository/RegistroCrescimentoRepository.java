package br.com.projeto.repository;

import br.com.projeto.model.crescimento.RegistroCrescimento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistroCrescimentoRepository extends JpaRepository<RegistroCrescimento, Long> {

    List<RegistroCrescimento> findByBebeIdOrderByDataRegistroDescIdDesc(Long bebeId);

    Optional<RegistroCrescimento> findByIdAndBebeId(Long id, Long bebeId);
}
