package com.visage.epimanager.company.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.Immutable;

@Entity
@Immutable
@Table(name = "empresas", schema = "epi_manager")
public class EmpresaEntity {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "razao_social", nullable = false)
    private String razaoSocial;

    @Column(name = "nome_fantasia")
    private String nomeFantasia;

    @Column(name = "cnpj", nullable = false, length = 14)
    private String cnpj;

    @Column(name = "email_contato")
    private String emailContato;

    @Column(name = "telefone")
    private String telefone;

    @Column(name = "status", nullable = false)
    private String status;

    protected EmpresaEntity() {
        // Required by JPA.
    }

    public UUID getId() {
        return id;
    }

    public String getRazaoSocial() {
        return razaoSocial;
    }

    public String getNomeFantasia() {
        return nomeFantasia;
    }

    public String getCnpj() {
        return cnpj;
    }

    public String getEmailContato() {
        return emailContato;
    }

    public String getTelefone() {
        return telefone;
    }

    public String getStatus() {
        return status;
    }
}
