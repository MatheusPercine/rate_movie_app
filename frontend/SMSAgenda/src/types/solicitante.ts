// Tipos para Solicitante

export interface SolicitanteRequest {
  // Para POST, o backend aceita id no corpo (ignorado) e ativo
  id?: number;
  nome: string;
  email: string;
  tipo: number;
  setor?: string;
  authId?: string;
  authPermId?: string;
  ativo?: boolean;
}

export interface SolicitanteResponse {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  tipo: number;
  setor?: string;
  authId?: string;
  authPermId?: string;
}
