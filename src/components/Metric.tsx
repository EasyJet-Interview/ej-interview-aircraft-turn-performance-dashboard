export const Metric = ({ label, value, detail }: { label: string; value: string; detail: string }) => (
  <section className="metric">
    <span className="eyebrow">{label}</span>
    <strong>{value}</strong>
    <span className="metric-detail">{detail}</span>
  </section>
)
