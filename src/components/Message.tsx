import type { ErrorMessage } from '../errors'

export const LoadingMessage = ({ children }: { children: string }) => (
  <div className="message" aria-live="polite">{children}</div>
)

export const EmptyMessage = ({ children }: { children: string }) => <div className="message">{children}</div>

export const ErrorPanel = ({ message }: { message: ErrorMessage }) => (
  <div className="message error" role="alert">
    <strong>{message.title}</strong>
    <span>{message.detail}</span>
  </div>
)
