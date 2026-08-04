# Weekly Aggregation

## Overview

The weekly aggregation system generates `weekly_stock_prices` records from `daily_stock_prices` records.

## Calculation Rules

| Field | Calculation |
|-------|-------------|
| `weekly_open` | Opening price of the first available trading session |
| `weekly_close` | Closing price of the last available trading session |
| `weekly_high` | Highest daily high during the week |
| `weekly_low` | Lowest daily low during the week |
| `total_weekly_volume` | Sum of all daily volumes |
| `total_weekly_value` | Sum of all daily traded values |
| `total_weekly_trades` | Sum of daily trade counts |
| `weekly_pct_change` | (weekly_close − previous_week_close) / previous_week_close × 100 |
| `weekly_volatility` | Std deviation of daily percentage changes |

## Handling Public Holidays

- Trading calendar table defines which dates are trading days
- Missing holidays are NOT flagged as data quality issues
- Unexpected missing sessions generate a `data_quality_issues` record with `partial_week_data`
- Weeks with fewer days than expected are labelled `data_completeness = 'partial'`

## Running Aggregation

### CLI Script
```bash
npm run aggregate:weekly
npm run aggregate:weekly 2026-07-28   # specific week
```

### Admin Panel
Navigate to `/data-portal/admin` → "Run Weekly Aggregation Now"

### API (staff only)
```http
POST /api/portal/aggregate
Content-Type: application/json

{"weekStart": "2026-07-28", "weekEnd": "2026-08-01"}
```

## Idempotency

- Uses `ON CONFLICT DO UPDATE` — safe to rerun
- Re-running after a daily correction automatically recalculates affected weeks
- Each run creates an `aggregation_jobs` record for observability

## Testing

```bash
npm test
```

All 20 weekly aggregation tests in `src/__tests__/weekly-aggregation.test.ts` must pass.
