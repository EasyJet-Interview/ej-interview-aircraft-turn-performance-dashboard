# Aircraft Turn Performance Dashboard

Build the backend that powers an aircraft-turn performance dashboard.

An aircraft **turn** begins when an arriving aircraft reaches its stand and ends when it leaves the stand for its next flight. Operations leaders need to compare performance across airports, understand whether turns meet each airport's service-level agreement (SLA), and investigate which activities contribute to missed targets.

The React frontend is supplied and runs immediately using illustrative demo API responses. Your task is to build the backend. You do not need to redesign or extend the frontend.

> **Start with [ASSIGNMENT.md](ASSIGNMENT.md).** It is the full exercise brief: the domain, the event lifecycle, the endpoints you need to implement and what we expect from your submission. This README covers running the supplied application and pointing it at your backend.

## Your task

Build a backend that:

1. Reads the supplied event data in [`data/turn-events.json`](data/turn-events.json).
2. Reads the airport targets in [`data/airport-slas.md`](data/airport-slas.md).
3. Reconstructs aircraft turns and calculates their performance.
4. Implements the three endpoints in [`docs/api-contract.md`](docs/api-contract.md).
5. Can be used by the supplied React application with demo mode disabled.
6. Includes automated backend tests.

You may use any mainstream backend language and framework. An empty [`backend/`](backend/) directory is provided as a suggested location, but you may organise your implementation differently.

## Run the supplied frontend

The frontend requires Node.js 22 or later.

```bash
npm install
npm run dev
```

Open the URL printed by Vite. The application starts in **demo mode**, where Mock Service Worker returns illustrative API responses. This lets you explore the expected interface before your backend exists.

The demo responses demonstrate the contract and interface only. They were not calculated from the supplied event file and do not contain the backend implementation.

## Connect the frontend to your backend

Copy the example environment file:

```bash
cp .env.example .env.local
```

Set your backend's base URL:

```dotenv
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:8080
```

Restart `npm run dev`. The frontend will now call your implementation.

If the frontend and backend run on different origins, your backend must permit requests from the frontend's local origin. Alternatively, you may serve both through the same origin and leave `VITE_API_BASE_URL` empty.

## Source data

The input represents records exported from a legacy operational system, representative of a remote event stream and supplied here as a JSON array for simplicity:

- `flightNumber` identifies a turn within a local calendar date, but flight numbers are reused on other dates.
- `eventDateTime` is an airport-local ISO 8601 date and time with no timezone or UTC offset.
- Do not modify the source file to clean it up.

See [`docs/event-contract.md`](docs/event-contract.md) for the lifecycle and field definitions.

## Required endpoints

```text
GET /api/airports/slas
GET /api/airports/performance?from=YYYY-MM-DD&to=YYYY-MM-DD
GET /api/airports/{airportCode}/performance?from=YYYY-MM-DD&to=YYYY-MM-DD
```

The `from` and `to` query parameters form an inclusive local-date range. Response shapes and examples are in [`docs/api-contract.md`](docs/api-contract.md).

## Frontend quality checks

You should not need to change the supplied frontend. Its existing checks are:

```bash
npm test
npm run lint
npm run build
```

## Completion checklist

Before you finish, confirm that:

- The frontend can retrieve all five SLA definitions from your backend.
- Network performance is calculated for an inclusive date range.
- Airport detail contains all turns in the requested range and their operation durations.
- Your backend tests cover the behaviour you consider important.
- The frontend runs with `VITE_USE_MOCK_API=false` against your backend.

Be prepared to demonstrate the dashboard using your backend and explain the key decisions in your implementation.
