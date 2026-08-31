# API contract

The supplied frontend expects JSON responses from three endpoints. All field names and enum values are case-sensitive. The values in the response examples are illustrative and are not the expected results for the supplied event file.

The `from` and `to` query parameters are required for performance endpoints and represent an inclusive local-date range in `YYYY-MM-DD` format.

## Retrieve airport SLAs

```http
GET /api/airports/slas
```

Return all five airport SLA definitions:

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

## Retrieve performance across airports

```http
GET /api/airports/performance?from=2026-08-03&to=2026-08-09
```

Return one summary for each airport with turns in the requested period:

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

## Retrieve performance for one airport

```http
GET /api/airports/LGW/performance?from=2026-08-03&to=2026-08-09
```

Return the same airport summary fields plus every turn for that airport in the period:

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
