package com.visage.epimanager.collaborator.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "colaboradores", schema = "epi_manager")
public class ColaboradorEntity {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "empresa_id", nullable = false)
    private UUID empresaId;

    @Column(name = "setor_id")
    private UUID setorId;

    @Column(name = "matricula", nullable = false, length = 40)
    private String matricula;

    @Column(name = "nome", nullable = false, length = 160)
    private String nome;

    @Column(name = "email", length = 254)
    private String email;

    @Column(name = "telefone", length = 30)
    private String telefone;

    @Column(name = "cargo", length = 120)
    private String cargo;

    @Column(name = "data_admissao")
    private LocalDate dataAdmissao;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    protected ColaboradorEntity() {
    }

    public ColaboradorEntity(
            UUID empresaId,
            UUID setorId,
            String matricula,
            String nome,
            String email,
            String telefone,
            String cargo,
            LocalDate dataAdmissao) {
        this.id = UUID.randomUUID();
        this.empresaId = empresaId;
        this.setorId = setorId;
        this.matricula = matricula;
        this.nome = nome;
        this.email = email;
        this.telefone = telefone;
        this.cargo = cargo;
        this.dataAdmissao = dataAdmissao;
        this.status = "ATIVO";
    }

    public UUID getId() { return id; }
    public UUID getEmpresaId() { return empresaId; }
    public UUID getSetorId() { return setorId; }
    public String getMatricula() { return matricula; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getTelefone() { return telefone; }
    public String getCargo() { return cargo; }
    public LocalDate getDataAdmissao() { return dataAdmissao; }
    public String getStatus() { return status; }

    public void update(
            UUID setorId,
            String matricula,
            String nome,
            String email,
            String telefone,
            String cargo,
            LocalDate dataAdmissao) {
        this.setorId = setorId;
        this.matricula = matricula;
        this.nome = nome;
        this.email = email;
        this.telefone = telefone;
        this.cargo = cargo;
        this.dataAdmissao = dataAdmissao;
    }

    public void changeStatus(String status) {
        this.status = status;
    }
}
