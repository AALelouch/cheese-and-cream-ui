export interface FinancialOperationRequest {
  products: Record<number, number>;
  idAgent: number;
  amount: number;
  concept: string;
  operationType: 'SALE' | 'PURCHASE' | 'PAYMENT' | 'CLIENT_PAYMENT';
}

export interface FinancialOperationResponse {
  id: number;
  productResponses: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    unitPrice: number;
    unitType: string;
  }>;
  idAgent: number;
  concept: string;
  total: number;
  operationType: 'SALE' | 'PURCHASE' | 'PAYMENT' | 'CLIENT_PAYMENT';
  date: string;
}
