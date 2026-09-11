# Take-home assignment: aircraft turn performance

An aircraft **turn** begins when an arriving aircraft reaches its stand and ends when it leaves the stand for its next flight. During that time, teams unload the aircraft, clean it, load it for the next flight and prepare it for departure.

Operations leaders want to understand how efficiently aircraft are turned at each airport, whether turns meet the airport's service-level agreement (SLA), how performance changes over time and which parts of the turn contribute most often to missed targets.

## Your assignment

Build a backend that reads the supplied aircraft-turn events and airport SLA definitions, calculates turn performance and makes the results available through the API endpoints described below.

We provide:

- A static JSON file containing events from multiple aircraft turns
- Airport SLA definitions in Markdown
- The React application and its expected backend API contract

The React application runs out of the box and provides the dashboard interface. It calls your backend to retrieve SLA definitions, performance across all airports and detailed performance for a selected airport. You do not need to build or redesign the frontend.

You may use any mainstream backend language and framework. An empty `backend/` directory is provided as a suggested location, but you may organise your implementation differently.

The dashboard uses one headline measure:

- **Total turn time:** elapsed time from `aircraftArrival` to `aircraftDeparture`, compared with that airport's SLA target

The intermediate operations should help users understand which parts of a turn contributed to its overall duration.

## Source data behaviour

The static event file represents data exported from a legacy operational system. It is representative of a remote event stream, supplied here as a JSON array for simplicity. You are not permitted to modify the provided data; you must work with it as is.

## Event lifecycle

For this exercise, a turn progresses through aircraft arrival, unloading, cleaning, loading, departure preparation and aircraft departure. Unloading includes passengers leaving the aircraft and inbound baggage being removed. Loading includes outbound baggage being loaded and passengers boarding.

| Order | Event type | Valid states | Meaning |
| ---: | --- | --- | --- |
| 1 | `aircraftArrival` | `COMPLETED` only | The aircraft has arrived on stand. This timestamp marks the start of the turn. |
| 2 | `aircraftUnloading` | `STARTED`, `COMPLETED` | Passengers disembark and inbound baggage is removed. |
| 3 | `aircraftCleaning` | `STARTED`, `COMPLETED` | The cabin is prepared for the next flight. |
| 4 | `aircraftLoading` | `STARTED`, `COMPLETED` | Outbound baggage is loaded and passengers board. |
| 5 | `departurePreparation` | `STARTED`, `COMPLETED` | Final checks are completed. Completion means the aircraft is ready to depart. |
| 6 | `aircraftDeparture` | `COMPLETED` only | The aircraft has left the stand. This timestamp marks the end of the turn. |

`aircraftArrival` and `aircraftDeparture` are instantaneous milestones pinned to a specific time. They do not represent activities with a duration, so they are emitted once with a state of `COMPLETED`. The operations between them span time and are each represented by a `STARTED` event followed by a `COMPLETED` event.

## Event contract

Every event has the same JSON shape:

```json
{
  "eventId": "evt-000184",
  "flightNumber": "EZY8123",
  "airportCode": "LGW",
  "eventType": "aircraftCleaning",
  "state": "STARTED",
  "eventDateTime": "2026-08-04T08:42:16"
}
```

| Field | Description |
| --- | --- |
| `eventId` | Unique identifier for the event. |
| `flightNumber` | Identifies the aircraft turn. Flight numbers are unique within a given day, but not globally unique. They are re-used to represent a route (e.g. every Tuesday 11:10 LGW -> AMS). |
| `airportCode` | Three-letter code for the airport where the turn takes place. |
| `eventType` | One of `aircraftArrival`, `aircraftUnloading`, `aircraftCleaning`, `aircraftLoading`, `departurePreparation` or `aircraftDeparture`. |
| `state` | `STARTED` or `COMPLETED`, subject to the valid states shown above. |
| `eventDateTime` | ISO 8601 local date and time without a timezone or UTC offset. The value is already localised to the airport identified by `airportCode`. Users always assume times are displayed in the localised timezone for the airport which originated the events. |

## What you need to build

Implement the three API endpoints expected by the supplied React application. The exercise uses a limited set of five airports: London Gatwick (`LGW`), London Luton (`LTN`), Manchester (`MAN`), Bristol (`BRS`) and Amsterdam (`AMS`).

All field names and enum values are case-sensitive. The `from` and `to` query parameters are required for the performance endpoints and represent an inclusive local-date range in `YYYY-MM-DD` format.

The values in the response examples below are illustrative. They are not the expected results for the supplied event file.

### Retrieve airport SLAs

`GET /api/airports/slas`

Return the supplied SLA definitions for the five airports.

```json
[
  {
    "airportCode": "LGW",
    "targetTurnMinutes": 40
  },
  {
    "airportCode": "LTN",
    "targetTurnMinutes": 35
  }
]
```

### Retrieve performance across airports

`GET /api/airports/performance?from=YYYY-MM-DD&to=YYYY-MM-DD`

Return calculated performance for each airport with turns in the requested inclusive local-date range. The React application uses this response to compare airports, identify the strongest and weakest performers and display changes over time.

```json
{
  "from": "2026-08-03",
  "to": "2026-08-09",
  "airports": [
    {
      "airportCode": "LGW",
      "turnCount": 28,
      "averageTurnMinutes": 35.4,
      "turnsMeetingSla": 24,
      "turnsMissingSla": 4,
      "slaCompliancePercentage": 85.7,
      "dailyPerformance": [
        {
          "date": "2026-08-03",
          "turnCount": 4,
          "averageTurnMinutes": 36.5,
          "slaCompliancePercentage": 75.0
        }
      ]
    }
  ]
}
```

### Retrieve performance for an airport

`GET /api/airports/{airportCode}/performance?from=YYYY-MM-DD&to=YYYY-MM-DD`

Return the same airport summary fields plus every turn belonging to that airport during the period. This is the most detailed view required by the exercise.

```json
{
  "airportCode": "LGW",
  "from": "2026-08-03",
  "to": "2026-08-09",
  "turnCount": 28,
  "averageTurnMinutes": 35.4,
  "turnsMeetingSla": 24,
  "turnsMissingSla": 4,
  "slaCompliancePercentage": 85.7,
  "dailyPerformance": [
    {
      "date": "2026-08-03",
      "turnCount": 4,
      "averageTurnMinutes": 36.5,
      "slaCompliancePercentage": 75.0
    }
  ],
  "turns": [
    {
      "flightNumber": "EZY8101",
      "arrivalDateTime": "2026-08-03T06:02:00",
      "departureDateTime": "2026-08-03T06:36:00",
      "totalTurnMinutes": 34,
      "slaTargetMinutes": 40,
      "metSla": true,
      "operations": [
        {
          "eventType": "aircraftUnloading",
          "startedAt": "2026-08-03T06:04:00",
          "completedAt": "2026-08-03T06:10:00",
          "durationMinutes": 6
        },
        {
          "eventType": "aircraftCleaning",
          "startedAt": "2026-08-03T06:11:00",
          "completedAt": "2026-08-03T06:15:00",
          "durationMinutes": 4
        },
        {
          "eventType": "aircraftLoading",
          "startedAt": "2026-08-03T06:16:00",
          "completedAt": "2026-08-03T06:26:00",
          "durationMinutes": 10
        },
        {
          "eventType": "departurePreparation",
          "startedAt": "2026-08-03T06:27:00",
          "completedAt": "2026-08-03T06:31:00",
          "durationMinutes": 4
        }
      ]
    }
  ]
}
```

## Calculation semantics

- A turn belongs to the local calendar date of its completed `aircraftArrival` event.
- Total turn time is elapsed minutes from completed `aircraftArrival` to completed `aircraftDeparture`.
- An operation's duration is elapsed minutes from its `STARTED` event to its `COMPLETED` event.
- `metSla` is `true` when `totalTurnMinutes` is less than or equal to `slaTargetMinutes`.
- `averageTurnMinutes` is the arithmetic mean for turns in that result.
- `slaCompliancePercentage` is `turnsMeetingSla / turnCount × 100`.
- `dailyPerformance` uses the same calculations grouped by local calendar date.
- The supplied frontend accepts integer or decimal calculated values.

## Empty results and errors

Use conventional HTTP status codes for invalid input and unknown airports. For a valid date range containing no turns, return a successful response with empty collections and zero counts rather than inventing data.

The frontend treats any non-2xx response as an API failure.

## What we expect

- The frontend retrieves all five SLA definitions from your backend.
- Network performance is calculated for an inclusive date range.
- Airport detail contains all turns in the requested range and their operation durations.
- Your backend includes automated tests covering the behaviour you consider important.
- The frontend runs against your backend with demo mode disabled.

Be prepared to demonstrate the dashboard using your backend and to explain the key decisions in your implementation.

## Running the application

See the [README](README.md) for how to install and run the supplied frontend, point it at your backend, and run its quality checks.
