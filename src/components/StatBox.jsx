export default function StatBox({ label, value, unit, highlight }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted uppercase tracking-widest text-[0.6rem]">
        {label}
      </span>
      <span
        className={`transition-colors duration-200 block min-w-12 ${
          highlight ? 'text-accent' : 'text-white'
        }`}
      >
        {value}
        {unit && (
          <span className="text-muted tracking-wide text-[0.75rem] pl-[0.15rem]">
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}
