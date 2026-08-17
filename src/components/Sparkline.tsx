type Props = {
  values: (number | undefined)[]
  min: number
  max: number
}

const WIDTH = 320
const HEIGHT = 44
const PAD = 4

// Egyszerű sparkline: 2px-es vonal, a kitöltetlen napok szakadások (adatlyuk),
// a magukban álló pontok pöttyök. Nincs tengely, nincs rács.
export default function Sparkline({ values, min, max }: Props) {
  const n = values.length
  const range = max - min || 1
  const x = (i: number) => (n <= 1 ? WIDTH / 2 : PAD + ((WIDTH - 2 * PAD) * i) / (n - 1))
  const y = (v: number) => HEIGHT - PAD - ((HEIGHT - 2 * PAD) * (v - min)) / range

  const runs: { i: number; v: number }[][] = []
  let run: { i: number; v: number }[] = []
  for (let i = 0; i < n; i++) {
    const v = values[i]
    if (v === undefined) {
      if (run.length > 0) runs.push(run)
      run = []
    } else {
      run.push({ i, v })
    }
  }
  if (run.length > 0) runs.push(run)

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="mt-1 h-11 w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {runs.map((points) => (
        <polyline
          key={`run-${points[0].i}`}
          // Egypontos szakasz is polyline: a kerek vonalvég pöttyként rajzolja ki,
          // és a non-scaling-stroke miatt nem torzul a széthúzott viewBox-ban.
          points={
            points.length === 1
              ? `${x(points[0].i)},${y(points[0].v)} ${x(points[0].i) + 0.01},${y(points[0].v)}`
              : points.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')
          }
          fill="none"
          stroke="var(--color-sage)"
          strokeWidth={points.length === 1 ? 5 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}
