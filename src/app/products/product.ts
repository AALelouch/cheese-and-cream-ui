export interface ProductResponse {
  id: number;
  name: string;
  quantity: number;
  price: number;
  cost: number;
  unitType: string;
  categoryName: string;
  agentName: string;
}

export interface ProductRequest {
  name: string;
  quantity: number;
  price: number;
  cost: number;
  unitType: string;
  categoryId: number;
  agendId: number;
}
