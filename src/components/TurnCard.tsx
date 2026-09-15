import type { TurnDetail } from '../api/types'
import { OPERATION_NAMES } from '../constants'
import { clockTime, minutes, shortDate } from '../format'

/** Widest operation bar, as a percentage per minute of duration. */
const TRACK_PERCENT_PER_MINUTE = 6

export const TurnCard = ({ turn }: { turn: TurnDetail }) => (
  <article className="turn-card">
    <div className="turn-summary">
      <div>
        <strong>{turn.flightNumber}</strong>
        <span>
          {shortDate(turn.arrivalDateTime.slice(0, 10))} · {clockTime(turn.arrivalDateTime)}–{clockTime(turn.departureDateTime)}
        </span>
      </div>
      <div>
        <strong>{minutes(turn.totalTurnMinutes)} min</strong>
        <span className={turn.metSla ? 'status-pass' : 'status-miss'}>
          {turn.metSla ? 'SLA met' : `${minutes(turn.totalTurnMinutes - turn.slaTargetMinutes)} min over`}
        </span>
      </div>
    </div>
    <div className="operations">
      {turn.operations.map((operation) => (
        <div className="operation" key={operation.eventType}>
          <span>{OPERATION_NAMES[operation.eventType]}</span>
          <div className="operation-track">
            <span style={{ width: `${Math.min(100, operation.durationMinutes * TRACK_PERCENT_PER_MINUTE)}%` }} />
          </div>
          <strong>{minutes(operation.durationMinutes)}</strong>
        </div>
      ))}
    </div>
  </article>
)
