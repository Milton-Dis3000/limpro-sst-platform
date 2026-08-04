export default function RiskBar({ bajo = 0, medio = 0, alto = 0 }) {
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-100">
      <div className="bg-green-500" style={{ width: `${bajo}%` }} />
      <div className="bg-amber-500" style={{ width: `${medio}%` }} />
      <div className="bg-red-500" style={{ width: `${alto}%` }} />
    </div>
  );
}
