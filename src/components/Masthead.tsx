import { isMockApiEnabled } from '../config'

export const Masthead = () => (
  <header className="masthead">
    <div className="brand-mark" aria-label="easyJet">easyJet</div>
    <span>Operations intelligence</span>
    {isMockApiEnabled() && <span className="demo-badge">Demo data</span>}
  </header>
)
