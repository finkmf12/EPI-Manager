package com.visage.epimanager.supplier.persistence;

import com.visage.epimanager.supplier.dto.SupplierRequest;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "fornecedores", schema = "epi_manager")
public class SupplierEntity {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;
    @Column(name = "empresa_id", nullable = false)
    private UUID empresaId;
    @Column(name = "razao_social", nullable = false, length = 180)
    private String razaoSocial;
    @Column(name = "nome_fantasia", length = 180)
    private String nomeFantasia;
    @Column(name = "cnpj", length = 14)
    private String cnpj;
    @Column(name = "email", length = 254)
    private String email;
    @Column(name = "telefone", length = 30)
    private String telefone;
    @Column(name = "contato", length = 120)
    private String contato;
    @Column(name = "ativo", nullable = false)
    private boolean ativo;

    protected SupplierEntity() {}

    public SupplierEntity(UUID empresaId, SupplierRequest request) {
        this.id = UUID.randomUUID();
        this.empresaId = empresaId;
        apply(request);
        this.ativo = true;
    }

    public UUID getId() { return id; }
    public UUID getEmpresaId() { return empresaId; }
    public String getRazaoSocial() { return razaoSocial; }
    public String getNomeFantasia() { return nomeFantasia; }
    public String getCnpj() { return cnpj; }
    public String getEmail() { return email; }
    public String getTelefone() { return telefone; }
    public String getContato() { return contato; }
    public boolean isAtivo() { return ativo; }

    public void update(SupplierRequest request) { apply(request); }
    public void deactivate() { this.ativo = false; }
    public void activate() { this.ativo = true; }

    private void apply(SupplierRequest request) {
        this.razaoSocial = request.razaoSocial();
        this.nomeFantasia = request.nomeFantasia();
        this.cnpj = request.cnpj();
        this.email = request.email();
        this.telefone = request.telefone();
        this.contato = request.contato();
    }
}
