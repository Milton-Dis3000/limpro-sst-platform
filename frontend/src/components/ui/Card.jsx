export default function Card({ children, className = "", ...props }) {
  return <section className={`min-w-0 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-200/60 sm:p-6 ${className}`} {...props}>{children}</section>;
}
