import { http, HttpResponse } from 'msw'
import { getMockAirport, getMockNetwork, getMockSlas } from './data'

function rangeFrom(request: Request) {
  const url = new URL(request.url)
  return {
    from: url.searchParams.get('from') ?? '2026-07-21',
    to: url.searchParams.get('to') ?? '2026-07-27',
  }
}

export const handlers = [
  http.get('*/api/airports/slas', () => HttpResponse.json(getMockSlas())),
  http.get('*/api/airports/performance', ({ request }) =>
    HttpResponse.json(getMockNetwork(rangeFrom(request))),
  ),
  http.get('*/api/airports/:airportCode/performance', ({ params, request }) => {
    const airport = getMockAirport(String(params.airportCode), rangeFrom(request))
    return airport
      ? HttpResponse.json(airport)
      : HttpResponse.json({ message: 'Airport not found' }, { status: 404 })
  }),
]
