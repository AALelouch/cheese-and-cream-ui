export interface ProductResponse {
  id: number;
  name: string;
  quantity: number;
  cost: number;
  unitType: string;
  categoryName: string;
}

export interface ProductIdNameResponse {
  id: number;
  name: string;
  quantity: number;
}

export interface ProductRequest {
  name: string;
  quantity: number;
  cost: number;
  unitType: string;
  categoryId: number;
  agendId: number;
}
