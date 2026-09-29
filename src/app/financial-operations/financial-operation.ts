export type OperationType = 'SALE' | 'PURCHASE' | 'PAYMENT' | 'CLIENT_PAYMENT';

export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  SALE: 'Venta',
  PURCHASE: 'Compra',
  PAYMENT: 'Pago a proveedor',
  CLIENT_PAYMENT: 'Pago a cliente'
};

export interface FinancialOperationProductRequest {
  quantity: number;
  price: number;
}

export interface FinancialOperationRequest {
  products: Record<number, FinancialOperationProductRequest>;
  idAgent: number;
  amount: number;
  concept?: string;
  operationType: OperationType;
}

export interface FinancialOperationResponse {
  id: number;
  productResponses: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }>;
  idAgent: number;
  concept: string;
  total: number;
  operationType: OperationType;
  date: string;
}
