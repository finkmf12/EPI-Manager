export interface CompanyMembership {
  companyId: string
  legalName: string
  tradeName?: string | null
  profile: string
  displayName?: string
}

export interface LoginResponse {
  selectionToken: string
  tokenType: string
  expiresInSeconds: number
  user: { id: string; name: string; email: string }
  companies: CompanyMembership[]
}

export interface SelectCompanyResponse {
  accessToken: string
  tokenType: string
  expiresInSeconds: number
  companyId: string
  companyProfile: string
}

export interface RegisterCompanyRequest {
  razaoSocial: string
  nomeFantasia?: string
  cnpj: string
  emailContato?: string
  telefone?: string
  nomeAdministrador: string
  emailAdministrador: string
  senhaAdministrador: string
}

export interface RegisterCompanyResponse {
  companyId: string
  companyName: string
  userId: string
  userEmail: string
  accessToken: string
  tokenType: string
  expiresInSeconds: number
  companyProfile: string
}

export interface CurrentCompanyResponse {
  id: string
  legalName: string
  tradeName?: string | null
  cnpj: string
  contactEmail?: string | null
  phone?: string | null
  status: string
}

export interface Collaborator {
  id: string
  setorId?: string | null
  matricula: string
  nome: string
  email?: string | null
  telefone?: string | null
  cargo?: string | null
  dataAdmissao?: string | null
  status: string
}

export interface Sector {
  id: string
  nome: string
  descricao?: string | null
  ativo: boolean
}

export interface Category {
  id: string
  nome: string
  descricao?: string | null
  ativo: boolean
}

export interface Epi {
  id: string
  categoriaId?: string | null
  codigo: string
  nome: string
  descricao?: string | null
  fabricante?: string | null
  modelo?: string | null
  numeroCa?: string | null
  caValidade?: string | null
  unidadeMedida: string
  estoqueMinimo: number | string
  vidaUtilDias?: number | null
  ativo: boolean
}

export interface Supplier {
  id: string
  razaoSocial: string
  nomeFantasia?: string | null
  cnpj?: string | null
  email?: string | null
  telefone?: string | null
  contato?: string | null
  ativo: boolean
}

export interface StockBalance {
  epiId: string
  codigo: string
  nome: string
  unidadeMedida: string
  epiAtivo: boolean
  estoqueMinimo: number | string
  saldoDisponivel: number | string
  saldoVencido: number | string
  abaixoDoMinimo: boolean
}

export interface StockLot {
  id: string
  epiId: string
  epiCodigo: string
  epiNome: string
  fornecedorId?: string | null
  fornecedorNome?: string | null
  codigoLote: string
  dataFabricacao?: string | null
  dataValidade?: string | null
  quantidadeInicial: number | string
  quantidadeDisponivel: number | string
  custoUnitario?: number | string | null
  recebidoEm: string
}

export interface StockMovement {
  id: string
  epiId: string
  loteId: string
  epiCodigo: string
  epiNome: string
  codigoLote: string
  usuarioId: string
  tipo: string
  quantidade: number | string
  origemTipo?: string | null
  origemId?: string | null
  observacao?: string | null
  createdAt: string
}

export interface StockReceiptResponse {
  loteId: string
  epiId: string
  codigoLote: string
  quantidadeRecebida: number | string
  saldoDisponivel: number | string
  recebidoEm: string
}

export interface DeliveryItem {
  id: string
  epiId: string
  loteId: string
  quantidade: number | string
  dataPrevistaSubstituicao?: string | null
  observacao?: string | null
}

export interface Delivery {
  id: string
  colaboradorId: string
  status: string
  dataEntrega: string
  observacao?: string | null
  confirmadoEm?: string | null
  canceladoEm?: string | null
  createdAt: string
  itens: DeliveryItem[]
}

export interface ReturnItem {
  id: string
  itemEntregaId: string
  quantidade: number | string
  condicao: 'REUTILIZAVEL' | 'DANIFICADO' | 'DESCARTE'
  observacao?: string | null
}

export interface EpiReturn {
  id: string
  entregaId: string
  status: string
  dataDevolucao: string
  observacao?: string | null
  confirmadoEm?: string | null
  canceladoEm?: string | null
  createdAt: string
  itens: ReturnItem[]
}
