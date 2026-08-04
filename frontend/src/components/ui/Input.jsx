export default function Input({ label, className = "", ...props }) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-[#2E2E2E]">
      {label}
      <input
        className={`h-12 rounded-lg border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 ${className}`}
        {...props}
      />
    </label>
  );
}
