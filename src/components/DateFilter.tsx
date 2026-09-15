import { useState, type FormEvent } from 'react'
import type { DateRange } from '../api/types'

interface DateFilterProps {
  initialRange: DateRange
  onApply: (range: DateRange) => void
}

export const DateFilter = ({ initialRange, onApply }: DateFilterProps) => {
  const [draft, setDraft] = useState(initialRange)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onApply(draft)
  }

  return (
    <form className="date-filter" onSubmit={submit}>
      <label>
        <span>From date</span>
        <input
          type="date"
          value={draft.from}
          max={draft.to}
          onChange={(event) => setDraft({ ...draft, from: event.target.value })}
        />
      </label>
      <label>
        <span>To date</span>
        <input
          type="date"
          value={draft.to}
          min={draft.from}
          onChange={(event) => setDraft({ ...draft, to: event.target.value })}
        />
      </label>
      <button type="submit">Apply dates</button>
    </form>
  )
}
