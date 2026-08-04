export default function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-[#F97316] text-white shadow-sm hover:bg-[#C2410C]",
    secondary: "bg-white text-[#2E2E2E] border border-zinc-200 shadow-sm hover:border-[#F97316] hover:bg-orange-50",
    ghost: "text-[#5A5A5A] hover:bg-white"
  };

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 [&>svg]:h-5 [&>svg]:w-5 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
