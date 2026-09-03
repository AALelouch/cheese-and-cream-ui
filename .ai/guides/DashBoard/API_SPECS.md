# API Specifications - CheeseAndCream Backend

**Base URL**: `http://localhost:8080/api`

---

## Dashboard Endpoints

### 📊 1. Get Monthly Financial Metrics

Returns complete financial dashboard data for a specific month.

**Endpoint**
```
GET /api/dashboard/monthly/{month}
```

**Parameters**
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| `month` | Integer | Path | Yes | Month number (1-12) |

**Response**
```json
{
  "totalDebt": 5000.00,
  "totalRevenue": 15000.00,
  "totalProfit": 10000.00,
  "pendingBalance": 3500.00
}
```

**Response Fields**
| Field | Type | Description |
|-------|------|-------------|
| `totalDebt` | Double | Sum of all PURCHASE operations (what we owe) |
| `totalRevenue` | Double | Sum of all SALE operations (sales made) |
| `totalProfit` | Double | Sum of SALE + PAYMENT operations (net profit) |
| `pendingBalance` | Double | Outstanding balance (unpaid sales) = SUM(SALE) - SUM(PAYMENT) |

**Status Codes**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid month (must be 1-12) |

**Example Request**
```bash
curl -X GET "http://localhost:8080/api/dashboard/monthly/9" \
  -H "Content-Type: application/json"
```

**Example Response**
```json
{
  "totalDebt": 8500.50,
  "totalRevenue": 22000.00,
  "totalProfit": 15000.00,
  "pendingBalance": 4200.75
}
```

---

### 💰 2. Get Total Pending Balance (All Time)

Returns the total accounts receivable across all operations.

**Endpoint**
```
GET /api/dashboard/pending-balance/total
```

**Parameters**
None

**Response**
```json
12500.50
```

**Response Description**
- **Type**: Double
- **Meaning**: Total amount all customers owe for unpaid sales
- **Formula**: SUM(All SALE operations) - SUM(All PAYMENT operations)

**Status Codes**
| Code | Description |
|------|-------------|
| 200 | Success |

**Example Request**
```bash
curl -X GET "http://localhost:8080/api/dashboard/pending-balance/total" \
  -H "Content-Type: application/json"
```

**Example Response**
```
12500.50
```

---

### 👤 3. Get Pending Balance by Agent/Customer

Returns how much a specific customer still owes.

**Endpoint**
```
GET /api/dashboard/pending-balance/agent/{agentId}
```

**Parameters**
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| `agentId` | Long | Path | Yes | Unique ID of the agent/customer |

**Response**
```json
2500.00
```

**Response Description**
- **Type**: Double
- **Meaning**: Total outstanding balance for that specific customer
- **Formula**: SUM(SALE for agent) - SUM(PAYMENT for agent)

**Status Codes**
| Code | Description |
|------|-------------|
| 200 | Success |
| 404 | Agent not found |

**Example Request**
```bash
curl -X GET "http://localhost:8080/api/dashboard/pending-balance/agent/5" \
  -H "Content-Type: application/json"
```

**Example Response**
```
2500.00
```

---

### 📅 4. Get Pending Balance by Month

Returns the pending balance (unpaid sales) for a specific month.

**Endpoint**
```
GET /api/dashboard/pending-balance/monthly/{month}
```

**Parameters**
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| `month` | Integer | Path | Yes | Month number (1-12) |

**Response**
```json
1800.50
```

**Response Description**
- **Type**: Double
- **Meaning**: Outstanding balance from sales made in the specified month
- **Formula**: SUM(SALE in month) - SUM(PAYMENT in month)

**Status Codes**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid month (must be 1-12) |

**Example Request**
```bash
curl -X GET "http://localhost:8080/api/dashboard/pending-balance/monthly/9" \
  -H "Content-Type: application/json"
```

**Example Response**
```
1800.50
```

---

## Financial Metrics Definitions

### 💳 Debt (Total Debt)
- **Calculation**: Sum of all PURCHASE operations
- **Meaning**: Total amount we owe to suppliers
- **Endpoint**: `GET /api/dashboard/monthly/{month}` → `totalDebt` field

### 📈 Revenue
- **Calculation**: Sum of all SALE operations
- **Meaning**: Total sales made (gross income)
- **Endpoint**: `GET /api/dashboard/monthly/{month}` → `totalRevenue` field

### 💹 Profit
- **Calculation**: Sum of SALE + PAYMENT operations
- **Meaning**: Net profit after collections
- **Endpoint**: `GET /api/dashboard/monthly/{month}` → `totalProfit` field

### 🔗 Pending Balance (Accounts Receivable)
- **Calculation**: SUM(SALE) - SUM(PAYMENT)
- **Meaning**: Total amount customers still owe for products sold
- **Endpoints**:
  - `GET /api/dashboard/monthly/{month}` → `pendingBalance` field
  - `GET /api/dashboard/pending-balance/total`
  - `GET /api/dashboard/pending-balance/agent/{agentId}`
  - `GET /api/dashboard/pending-balance/monthly/{month}`

---

## Example Integration Scenarios

### Scenario 1: Display Monthly Dashboard
```bash
# Get all metrics for September
curl -X GET "http://localhost:8080/api/dashboard/monthly/9"
```

**Frontend Usage**:
```javascript
// React/Angular example
async function fetchMonthlyDashboard(month) {
  const response = await fetch(`http://localhost:8080/api/dashboard/monthly/${month}`);
  const data = await response.json();
  
  console.log(`Debt: $${data.totalDebt}`);
  console.log(`Revenue: $${data.totalRevenue}`);
  console.log(`Profit: $${data.totalProfit}`);
  console.log(`Pending to Collect: $${data.pendingBalance}`);
}
```

### Scenario 2: Track Customer Receivables
```bash
# Get how much customer #5 owes
curl -X GET "http://localhost:8080/api/dashboard/pending-balance/agent/5"
```

**Frontend Usage**:
```javascript
async function getCustomerBalance(agentId) {
  const response = await fetch(
    `http://localhost:8080/api/dashboard/pending-balance/agent/${agentId}`
  );
  const pendingAmount = await response.json();
  
  console.log(`Customer ${agentId} owes: $${pendingAmount}`);
}
```

### Scenario 3: Monitor Total Company Receivables
```bash
# Get total amount owed by all customers
curl -X GET "http://localhost:8080/api/dashboard/pending-balance/total"
```

**Frontend Usage**:
```javascript
async function fetchTotalReceivables() {
  const response = await fetch(
    'http://localhost:8080/api/dashboard/pending-balance/total'
  );
  const totalPending = await response.json();
  
  console.log(`Total amount to collect: $${totalPending}`);
}
```

---

## Error Handling

### Invalid Month (400 Bad Request)
```bash
curl -X GET "http://localhost:8080/api/dashboard/monthly/13"
```

**Response**:
```
400 Bad Request
```

### Agent Not Found (404 Not Found)
```bash
curl -X GET "http://localhost:8080/api/dashboard/pending-balance/agent/999"
```

**Response**:
```
404 Not Found
```

---

## API Consistency Notes

- **All monetary values** are returned as `Double` (floating-point numbers)
- **Null Safety**: If no data exists for a period, the endpoint returns `0.0`
- **Date Range**: All monthly queries calculate from the 1st to the last day of the specified month
- **Soft Deletes**: Only active records (`active = true`) are included in calculations
- **Response Times**: Queries are optimized with indexed database queries (see repository `@Query` annotations)

---

## HTTP Methods & Status Codes

| Method | Endpoint | Purpose | Status Codes |
|--------|----------|---------|--------------|
| GET | `/dashboard/monthly/{month}` | Fetch all metrics | 200, 400 |
| GET | `/dashboard/pending-balance/total` | Fetch total receivables | 200 |
| GET | `/dashboard/pending-balance/agent/{agentId}` | Fetch customer receivables | 200, 404 |
| GET | `/dashboard/pending-balance/monthly/{month}` | Fetch monthly receivables | 200, 400 |

---

## Authentication & Authorization

Currently, all dashboard endpoints are **public** (no authentication required).

**Future Enhancement**: Add `@PreAuthorize` annotations for role-based access control.

---

## Database Query Performance

All endpoints use optimized JPA `@Query` methods with `CASE WHEN` and `SUM()` aggregations:

```java
@Query("SELECT COALESCE(SUM(CASE WHEN t.operationType = 'SALE' THEN t.total " +
       "WHEN t.operationType = 'PAYMENT' THEN -t.total ELSE 0 END), 0) " +
       "FROM FinancialOperation t WHERE t.active = true " +
       "AND t.creationDate BETWEEN :startDate AND :endDate")
Double calculatePendingBalanceByTimeRange(@Param("startDate") LocalDateTime startDate,
                                          @Param("endDate") LocalDateTime endDate);
```

**Performance**: O(n) database query, typically executes in <50ms for normal datasets.

---

## Swagger/OpenAPI Documentation

Auto-generated Swagger UI is available at:
```
http://localhost:8080/swagger-ui.html
```

All endpoints are documented with:
- Request parameters
- Response schemas
- Example values
- Status codes

---

**Last Updated**: September 3, 2026  
**API Version**: 1.0

