type Props = {
  points: { x: number; y: number }[]
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  xLabel: string
  yLabel: string
}

const WIDTH = 320
const HEIGHT = 180
const PAD = 14

export default function Scatter({ points, xMin, xMax, yMin, yMax, xLabel, yLabel }: Props) {
  const xRange = xMax - xMin || 1
  const yRange = yMax - yMin || 1
  const px = (v: number) => PAD + ((WIDTH - 2 * PAD) * (v - xMin)) / xRange
  const py = (v: number) => HEIGHT - PAD - ((HEIGHT - 2 * PAD) * (v - yMin)) / yRange

  // A diszkrét skálákon az azonos (x,y) napok egy jellé olvadnak,
  // a jel mérete a napok számát hordozza.
  const grouped = new Map<string, { x: number; y: number; count: number }>()
  for (const point of points) {
    const key = `${point.x}|${point.y}`
    const group = grouped.get(key)
    if (group) {
      group.count++
    } else {
      grouped.set(key, { ...point, count: 1 })
    }
  }

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" aria-hidden="true">
        <rect
          x={PAD}
          y={PAD}
          width={WIDTH - 2 * PAD}
          height={HEIGHT - 2 * PAD}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={1}
        />
        {[...grouped.values()].map((group) => (
          <circle
            key={`${group.x}|${group.y}`}
            cx={px(group.x)}
            cy={py(group.y)}
            r={4 + 2.5 * Math.sqrt(group.count - 1)}
            fill="var(--color-sage)"
            fillOpacity={0.75}
            stroke="var(--color-paper)"
            strokeWidth={2}
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>{yLabel} ↑</span>
        <span>{xLabel} →</span>
      </div>
    </div>
  )
}
