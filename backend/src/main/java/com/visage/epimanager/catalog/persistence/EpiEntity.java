package com.visage.epimanager.catalog.persistence;

import com.visage.epimanager.catalog.dto.EpiRequest;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "epis", schema = "epi_manager")
public class EpiEntity {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "empresa_id", nullable = false)
    private UUID empresaId;

    @Column(name = "categoria_id")
    private UUID categoriaId;

    @Column(name = "codigo", nullable = false, length = 50)
    private String codigo;

    @Column(name = "nome", nullable = false, length = 160)
    private String nome;

    @Column(name = "descricao", columnDefinition = "text")
    private String descricao;

    @Column(name = "fabricante", length = 120)
    private String fabricante;

    @Column(name = "modelo", length = 120)
    private String modelo;

    @Column(name = "numero_ca", length = 30)
    private String numeroCa;

    @Column(name = "ca_validade")
    private LocalDate caValidade;

    @Enumerated(EnumType.STRING)
    @Column(name = "unidade_medida", nullable = false, length = 12)
    private UnidadeMedida unidadeMedida;

    @Column(name = "estoque_minimo", nullable = false, precision = 12, scale = 3)
    private BigDecimal estoqueMinimo;

    @Column(name = "vida_util_dias")
    private Integer vidaUtilDias;

    @Column(name = "ativo", nullable = false)
    private boolean ativo;

    protected EpiEntity() {
    }

    public EpiEntity(UUID empresaId, EpiRequest request) {
        this.id = UUID.randomUUID();
        this.empresaId = empresaId;
        apply(request);
        this.ativo = true;
    }

    public UUID getId() { return id; }
    public UUID getEmpresaId() { return empresaId; }
    public UUID getCategoriaId() { return categoriaId; }
    public String getCodigo() { return codigo; }
    public String getNome() { return nome; }
    public String getDescricao() { return descricao; }
    public String getFabricante() { return fabricante; }
    public String getModelo() { return modelo; }
    public String getNumeroCa() { return numeroCa; }
    public LocalDate getCaValidade() { return caValidade; }
    public UnidadeMedida getUnidadeMedida() { return unidadeMedida; }
    public BigDecimal getEstoqueMinimo() { return estoqueMinimo; }
    public Integer getVidaUtilDias() { return vidaUtilDias; }
    public boolean isAtivo() { return ativo; }

    public void update(EpiRequest request) {
        apply(request);
    }

    public void deactivate() {
        this.ativo = false;
    }

    private void apply(EpiRequest request) {
        this.categoriaId = request.categoriaId();
        this.codigo = request.codigo().trim();
        this.nome = request.nome().trim();
        this.descricao = normalizeOptional(request.descricao());
        this.fabricante = normalizeOptional(request.fabricante());
        this.modelo = normalizeOptional(request.modelo());
        this.numeroCa = normalizeOptional(request.numeroCa());
        this.caValidade = request.caValidade();
        this.unidadeMedida = request.unidadeMedida();
        this.estoqueMinimo = request.estoqueMinimo();
        this.vidaUtilDias = request.vidaUtilDias();
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
