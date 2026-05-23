# FinGold DigiGold — Frontend

React + TypeScript + Vite frontend connected to the Spring Boot backend.

## Quick Start

```bash
# Install dependencies (uses pnpm)
pnpm install

# Start dev server (runs on http://localhost:5173)
pnpm dev
```

The `.env` file already points to `http://localhost:8080` where the backend runs.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with live gold price from backend |
| `/login` | Login form — calls `POST /api/v1/auth/login` |
| `/register` | Register form — calls `POST /api/v1/auth/register` |
| `/dashboard` | Protected — Buy, Sell, Wallet, Transactions |

## API Integration

All API calls are in `client/src/lib/api.ts`. The auth token is stored in `localStorage` and automatically attached to every request. On 401, the token is refreshed automatically.

## Notes
- Make sure the backend is running on port 8080 before starting the frontend.
- Replace `rzp_test_REPLACE_YOUR_KEY_ID` in the backend config with a real Razorpay test key to enable payments.
