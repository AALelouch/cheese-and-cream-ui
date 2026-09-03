export interface AgentResponse {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  balance: number;
  identificationType: string;
  identificationTypeId?: number;
  identificationNumber: string;
}

export interface AgentRequest {
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  balance: string;
  identificationTypeId: number;
  identificationNumber: string;
}
