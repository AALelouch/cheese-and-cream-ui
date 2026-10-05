export type AgentRole = 'CLIENT' | 'PROVIDER';

export const AGENT_ROLE_LABEL: Record<AgentRole, string> = {
  CLIENT: 'Cliente',
  PROVIDER: 'Proveedor'
};

export interface AgentResponse {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  payables: string;
  receivables: string;
  balance: string;
  role: AgentRole;
  identificationType: string;
  identificationTypeId?: number;
  identificationNumber: string;
}

export interface AgentIdNameResponse {
  id: number;
  name: string;
}

export interface AgentUpsertRequest {
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  receivables: number;
  payables: number;
  identificationTypeId: number;
  role: AgentRole;
  identificationNumber: string;
}
