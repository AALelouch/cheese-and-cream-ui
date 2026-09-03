# Frontend Integration Guide - Dashboard API

## Quick Summary

4 new REST endpoints for fetching financial metrics and accounts receivable data.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/dashboard/monthly/{month}` | GET | All metrics for a month |
| `/api/dashboard/pending-balance/total` | GET | Total amount owed by all customers |
| `/api/dashboard/pending-balance/agent/{agentId}` | GET | Amount owed by specific customer |
| `/api/dashboard/pending-balance/monthly/{month}` | GET | Pending balance for specific month |

---

## TypeScript/JavaScript Examples

### 1. Fetch Complete Monthly Dashboard

```typescript
interface DashboardResponse {
  totalDebt: number;
  totalRevenue: number;
  totalProfit: number;
  pendingBalance: number;
}

async function getMonthlyDashboard(month: number): Promise<DashboardResponse> {
  const response = await fetch(
    `http://localhost:8080/api/dashboard/monthly/${month}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
  }
  
  return response.json();
}

// Usage
getMonthlyDashboard(9)
  .then(data => {
    console.log(`Debt: $${data.totalDebt}`);
    console.log(`Revenue: $${data.totalRevenue}`);
    console.log(`Profit: $${data.totalProfit}`);
    console.log(`Pending to Collect: $${data.pendingBalance}`);
  })
  .catch(error => console.error(error));
```

### 2. Display Monthly Metrics in React Component

```typescript
import { useEffect, useState } from 'react';

interface DashboardData {
  totalDebt: number;
  totalRevenue: number;
  totalProfit: number;
  pendingBalance: number;
}

export function MonthlyDashboard({ month }: { month: number }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch(
          `http://localhost:8080/api/dashboard/monthly/${month}`
        );
        
        if (!response.ok) throw new Error('Failed to fetch dashboard');
        
        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [month]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div className="dashboard">
      <h2>Financial Dashboard - Month {month}</h2>
      
      <div className="metrics-grid">
        <MetricCard 
          title="Total Debt" 
          value={`$${data.totalDebt.toFixed(2)}`}
          color="red"
        />
        <MetricCard 
          title="Total Revenue" 
          value={`$${data.totalRevenue.toFixed(2)}`}
          color="green"
        />
        <MetricCard 
          title="Total Profit" 
          value={`$${data.totalProfit.toFixed(2)}`}
          color="blue"
        />
        <MetricCard 
          title="Pending to Collect" 
          value={`$${data.pendingBalance.toFixed(2)}`}
          color="orange"
        />
      </div>
    </div>
  );
}

function MetricCard({ title, value, color }: { 
  title: string; 
  value: string; 
  color: string 
}) {
  return (
    <div className={`card card-${color}`}>
      <h3>{title}</h3>
      <p className="metric-value">{value}</p>
    </div>
  );
}
```

### 3. Get Total Accounts Receivable

```typescript
async function getTotalReceivables(): Promise<number> {
  const response = await fetch(
    'http://localhost:8080/api/dashboard/pending-balance/total'
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch receivables');
  }
  
  return response.json();
}

// Usage
getTotalReceivables()
  .then(total => {
    console.log(`Total amount to collect: $${total.toFixed(2)}`);
  })
  .catch(error => console.error(error));
```

### 4. Track Individual Customer Receivables

```typescript
async function getCustomerBalance(agentId: number): Promise<number> {
  const response = await fetch(
    `http://localhost:8080/api/dashboard/pending-balance/agent/${agentId}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch balance for customer ${agentId}`);
  }
  
  return response.json();
}

// Usage - Show customer debt in a table
async function displayCustomerDebtTable(customerIds: number[]) {
  const balances = await Promise.all(
    customerIds.map(async (id) => ({
      customerId: id,
      balance: await getCustomerBalance(id)
    }))
  );
  
  console.table(balances);
  // Output:
  // ┌───────────────┬─────────┐
  // │   customerId  │ balance │
  // ├───────────────┼─────────┤
  // │       1       │ 1500.00 │
  // │       2       │ 2300.50 │
  // │       5       │  800.25 │
  // └───────────────┴─────────┘
}
```

### 5. Angular Service Example

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface DashboardResponse {
  totalDebt: number;
  totalRevenue: number;
  totalProfit: number;
  pendingBalance: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:8080/api/dashboard';

  constructor(private http: HttpClient) {}

  getMonthlyMetrics(month: number): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(
      `${this.apiUrl}/monthly/${month}`
    );
  }

  getTotalPendingBalance(): Observable<number> {
    return this.http.get<number>(
      `${this.apiUrl}/pending-balance/total`
    );
  }

  getAgentPendingBalance(agentId: number): Observable<number> {
    return this.http.get<number>(
      `${this.apiUrl}/pending-balance/agent/${agentId}`
    );
  }

  getMonthlyPendingBalance(month: number): Observable<number> {
    return this.http.get<number>(
      `${this.apiUrl}/pending-balance/monthly/${month}`
    );
  }
}

// Usage in Component
@Component({
  selector: 'app-dashboard',
  template: `
    <div *ngIf="dashboard$ | async as data">
      <h2>Monthly Dashboard</h2>
      <p>Debt: ${{ data.totalDebt }}</p>
      <p>Revenue: ${{ data.totalRevenue }}</p>
      <p>Profit: ${{ data.totalProfit }}</p>
      <p>Pending: ${{ data.pendingBalance }}</p>
    </div>
  `
})
export class DashboardComponent {
  dashboard$: Observable<DashboardResponse>;

  constructor(private dashboardService: DashboardService) {
    this.dashboard$ = this.dashboardService.getMonthlyMetrics(9);
  }
}
```

### 6. Using Axios

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/dashboard';

interface DashboardResponse {
  totalDebt: number;
  totalRevenue: number;
  totalProfit: number;
  pendingBalance: number;
}

class DashboardAPI {
  async getMonthlyDashboard(month: number): Promise<DashboardResponse> {
    const response = await axios.get<DashboardResponse>(
      `${API_URL}/monthly/${month}`
    );
    return response.data;
  }

  async getTotalReceivables(): Promise<number> {
    const response = await axios.get<number>(
      `${API_URL}/pending-balance/total`
    );
    return response.data;
  }

  async getCustomerBalance(agentId: number): Promise<number> {
    const response = await axios.get<number>(
      `${API_URL}/pending-balance/agent/${agentId}`
    );
    return response.data;
  }

  async getMonthlyPendingBalance(month: number): Promise<number> {
    const response = await axios.get<number>(
      `${API_URL}/pending-balance/monthly/${month}`
    );
    return response.data;
  }
}

// Usage
const api = new DashboardAPI();

api.getMonthlyDashboard(9)
  .then(data => console.log('Dashboard:', data))
  .catch(error => console.error('Error:', error));
```

### 7. Error Handling Best Practices

```typescript
async function safeApiCall<T>(
  url: string,
  defaultValue: T
): Promise<T> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      return defaultValue;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Network Error:', error);
    return defaultValue;
  }
}

// Usage with fallback values
const metrics = await safeApiCall(
  'http://localhost:8080/api/dashboard/monthly/9',
  {
    totalDebt: 0,
    totalRevenue: 0,
    totalProfit: 0,
    pendingBalance: 0
  }
);
```

---

## Environment Configuration

### Development (localhost)
```typescript
const API_BASE_URL = 'http://localhost:8080/api';
```

### Production
```typescript
const API_BASE_URL = 'https://api.cheeseandcream.com/api';
```

### Environment Service Example
```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};

// In service
import { environment } from '../environments/environment';

export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;
  // ...
}
```

---

## Testing Examples

### Jest Test Suite
```typescript
describe('DashboardService', () => {
  let service: DashboardService;
  
  beforeEach(() => {
    service = new DashboardService();
  });

  it('should fetch monthly metrics', async () => {
    const data = await service.getMonthlyMetrics(9);
    
    expect(data).toHaveProperty('totalDebt');
    expect(data).toHaveProperty('totalRevenue');
    expect(data).toHaveProperty('totalProfit');
    expect(data).toHaveProperty('pendingBalance');
    expect(typeof data.pendingBalance).toBe('number');
  });

  it('should handle API errors gracefully', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(
      new Error('Network error')
    );
    
    await expect(
      service.getMonthlyMetrics(9)
    ).rejects.toThrow('Network error');
  });
});
```

---

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": { "name": "CheeseAndCream Dashboard API" },
  "item": [
    {
      "name": "Get Monthly Dashboard",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:8080/api/dashboard/monthly/9",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "dashboard", "monthly", "9"]
        }
      }
    },
    {
      "name": "Get Total Pending Balance",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:8080/api/dashboard/pending-balance/total",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "dashboard", "pending-balance", "total"]
        }
      }
    },
    {
      "name": "Get Customer Balance",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:8080/api/dashboard/pending-balance/agent/5",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "dashboard", "pending-balance", "agent", "5"]
        }
      }
    },
    {
      "name": "Get Monthly Pending Balance",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:8080/api/dashboard/pending-balance/monthly/9",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "dashboard", "pending-balance", "monthly", "9"]
        }
      }
    }
  ]
}
```

---

## Summary for Frontend Team

✅ **4 new endpoints** ready for integration  
✅ **No authentication required** (for now)  
✅ **All responses are JSON** with numeric values  
✅ **Optimized queries** - fast performance  
✅ **Clear error handling** - 404 if agent not found, 400 if invalid month  

**Start integrating!** All endpoints are live on `http://localhost:8080/api/dashboard`


