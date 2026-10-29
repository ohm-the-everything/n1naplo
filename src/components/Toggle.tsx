type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}

export default function Toggle({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex h-11 w-14 shrink-0 items-center justify-center rounded-full"
    >
      <span
        className={`relative h-7 w-12 rounded-full transition-colors ${checked ? 'bg-sage' : 'bg-line'}`}
      >
        <span
          className="absolute top-0.5 left-0 h-6 w-6 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </span>
    </button>
  )
}
