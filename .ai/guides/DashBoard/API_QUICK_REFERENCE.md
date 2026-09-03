# Dashboard API - Quick Reference (Cheat Sheet)

## Base URL
```
http://localhost:8080/api/dashboard
```

---

## Endpoints (Copy & Paste Ready)

### 1️⃣ All Metrics for a Month
```
GET /api/dashboard/monthly/{month}
```
**Example**: `GET /api/dashboard/monthly/9`

**Response**:
```json
{
  "totalDebt": 8500.50,
  "totalRevenue": 22000.00,
  "totalProfit": 15000.00,
  "pendingBalance": 4200.75
}
```

---

### 2️⃣ Total Amount Customers Owe (All Time)
```
GET /api/dashboard/pending-balance/total
```

**Response**:
```json
12500.50
```

---

### 3️⃣ How Much One Customer Owes
```
GET /api/dashboard/pending-balance/agent/{agentId}
```
**Example**: `GET /api/dashboard/pending-balance/agent/5`

**Response**:
```json
2500.00
```

---

### 4️⃣ Pending Balance for a Specific Month
```
GET /api/dashboard/pending-balance/monthly/{month}
```
**Example**: `GET /api/dashboard/pending-balance/monthly/9`

**Response**:
```json
1800.50
```

---

## JavaScript/TypeScript Examples

### Fetch Current Month Dashboard
```javascript
fetch('http://localhost:8080/api/dashboard/monthly/9')
  .then(r => r.json())
  .then(data => {
    console.log('Debt:', data.totalDebt);
    console.log('Revenue:', data.totalRevenue);
    console.log('Profit:', data.totalProfit);
    console.log('Pending:', data.pendingBalance);
  });
```

### Fetch Total Receivables
```javascript
fetch('http://localhost:8080/api/dashboard/pending-balance/total')
  .then(r => r.json())
  .then(total => console.log('Total to Collect: $' + total));
```

### Fetch Customer Balance
```javascript
const agentId = 5;
fetch(`http://localhost:8080/api/dashboard/pending-balance/agent/${agentId}`)
  .then(r => r.json())
  .then(balance => console.log(`Customer ${agentId} owes: $${balance}`));
```

---

## React Hook Example

```typescript
import { useState, useEffect } from 'react';

export function useDashboardMetrics(month: number) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8080/api/dashboard/monthly/${month}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [month]);

  return { data, loading };
}

// Usage
function Dashboard() {
  const { data, loading } = useDashboardMetrics(9);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Debt: ${data.totalDebt}</p>
      <p>Revenue: ${data.totalRevenue}</p>
      <p>Profit: ${data.totalProfit}</p>
      <p>⚠️ Pending: ${data.pendingBalance}</p>
    </div>
  );
}
```

---

## Angular HTTP Service

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class DashboardService {
  constructor(private http: HttpClient) {}

  getMetrics(month: number) {
    return this.http.get(`http://localhost:8080/api/dashboard/monthly/${month}`);
  }

  getTotalReceivables() {
    return this.http.get('http://localhost:8080/api/dashboard/pending-balance/total');
  }

  getAgentBalance(agentId: number) {
    return this.http.get(`http://localhost:8080/api/dashboard/pending-balance/agent/${agentId}`);
  }

  getMonthlyPending(month: number) {
    return this.http.get(`http://localhost:8080/api/dashboard/pending-balance/monthly/${month}`);
  }
}
```

---

## Response Field Meanings

| Field | Means | Formula |
|-------|-------|---------|
| `totalDebt` | What we owe suppliers | SUM(PURCHASE) |
| `totalRevenue` | Sales made | SUM(SALE) |
| `totalProfit` | Profit after collections | SUM(SALE) + SUM(PAYMENT) |
| `pendingBalance` | What customers owe us | SUM(SALE) - SUM(PAYMENT) |

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | ✅ Success |
| 400 | ❌ Invalid month (use 1-12) |
| 404 | ❌ Agent not found |

---

## Curl Commands (for testing)

```bash
# Get monthly metrics
curl http://localhost:8080/api/dashboard/monthly/9

# Get total receivables
curl http://localhost:8080/api/dashboard/pending-balance/total

# Get customer 5 balance
curl http://localhost:8080/api/dashboard/pending-balance/agent/5

# Get September pending balance
curl http://localhost:8080/api/dashboard/pending-balance/monthly/9
```

---

## Headers Required

```
Content-Type: application/json
```

---

## No Authentication

✅ All endpoints are **publicly accessible** right now.

**Future**: Will add JWT token authentication.

---

## Where to Find Full Docs

- **API_SPECS.md** - Complete API documentation
- **FRONTEND_INTEGRATION_GUIDE.md** - Code examples & best practices
- **Swagger UI** - http://localhost:8080/swagger-ui.html

---

**Last Updated**: September 3, 2026

