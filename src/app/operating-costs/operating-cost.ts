export interface OperatingCostRequest {
  concept: string;
  amount: number;
}

export interface OperatingCostResponse {
  id: number;
  concept: string;
  amount: number;
  date: string;
}
