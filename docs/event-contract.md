# Event contract

Every record in [`../data/turn-events.json`](../data/turn-events.json) has this shape:

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

| Field | Meaning |
|---|---|
| `eventId` | Unique event identifier. Repeated records with the same value represent the same event delivery. |
| `flightNumber` | Identifies the aircraft turn within a local calendar date. Flight numbers may be reused on later dates. |
| `airportCode` | Three-letter code for the airport where the turn takes place. |
| `eventType` | One of the six lifecycle event types below. |
| `state` | `STARTED` or `COMPLETED`, subject to the lifecycle rules below. |
| `eventDateTime` | Airport-local ISO 8601 date and time without a timezone or UTC offset. |

## Turn lifecycle

A turn progresses through these events:

| Order | Event type | Valid states | Meaning |
|---:|---|---|---|
| 1 | `aircraftArrival` | `COMPLETED` | Aircraft has arrived on stand. This is the start of the turn. |
| 2 | `aircraftUnloading` | `STARTED`, `COMPLETED` | Passengers disembark and inbound baggage is removed. |
| 3 | `aircraftCleaning` | `STARTED`, `COMPLETED` | The cabin is prepared for the next flight. |
| 4 | `aircraftLoading` | `STARTED`, `COMPLETED` | Outbound baggage is loaded and passengers board. |
| 5 | `departurePreparation` | `STARTED`, `COMPLETED` | Final checks are completed. |
| 6 | `aircraftDeparture` | `COMPLETED` | Aircraft has left the stand. This is the end of the turn. |

Arrival and departure are instantaneous milestones, so each has only a `COMPLETED` event. Intermediate operations span time and each has one `STARTED` event and one `COMPLETED` event.

## Airports

The dataset contains turns at:

- London Gatwick (`LGW`)
- London Luton (`LTN`)
- Manchester (`MAN`)
- Bristol (`BRS`)
- Amsterdam Schiphol (`AMS`)

All timestamps have already been localised to the airport identified by `airportCode`. Treat their local calendar date and displayed clock time as authoritative for this exercise.
