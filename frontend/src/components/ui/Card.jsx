export default function Card({ children, className = "", ...props }) {
  return <section className={`rounded-xl border border-zinc-200/80 bg-white p-6 shadow-sm shadow-zinc-200/60 ${className}`} {...props}>{children}</section>;
}
