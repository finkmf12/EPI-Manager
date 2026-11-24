package com.visage.epimanager.catalog.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "categorias_epi", schema = "epi_manager")
public class CategoryEntity {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "empresa_id", nullable = false)
    private UUID empresaId;

    @Column(name = "nome", nullable = false, length = 120)
    private String nome;

    @Column(name = "descricao", columnDefinition = "text")
    private String descricao;

    @Column(name = "ativo", nullable = false)
    private boolean ativo;

    protected CategoryEntity() {
    }

    public CategoryEntity(UUID empresaId, String nome, String descricao) {
        this.id = UUID.randomUUID();
        this.empresaId = empresaId;
        this.nome = nome;
        this.descricao = descricao;
        this.ativo = true;
    }

    public UUID getId() { return id; }
    public UUID getEmpresaId() { return empresaId; }
    public String getNome() { return nome; }
    public String getDescricao() { return descricao; }
    public boolean isAtivo() { return ativo; }

    public void update(String nome, String descricao) {
        this.nome = nome;
        this.descricao = descricao;
    }

    public void deactivate() {
        this.ativo = false;
    }

    public void activate() {
        this.ativo = true;
    }
}
