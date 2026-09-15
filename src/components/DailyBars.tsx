import type { DailyPerformance } from '../api/types'
import { percentage, shortDate } from '../format'

export const DailyBars = ({ days }: { days: DailyPerformance[] }) => (
  <div className="trend-panel">
    <h3>Daily SLA compliance</h3>
    <div className="daily-bars">
      {days.map((day) => (
        <div className="day-column" key={day.date}>
          <span className="bar-value">{percentage(day.slaCompliancePercentage, 0)}</span>
          <div className="bar-track"><span style={{ height: `${day.slaCompliancePercentage}%` }} /></div>
          <span>{shortDate(day.date)}</span>
        </div>
      ))}
    </div>
  </div>
)
