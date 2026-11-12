export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-6 items-end gap-0.5" aria-hidden="true">
        {[0, 0.2, 0.4, 0.1].map((d, i) => (
          <span key={i} className="eq-bar w-1 h-full rounded-full bg-gradient-neon" style={{ animationDelay: `${d}s` }} />
        ))}
      </div>
      <span className="font-display text-lg font-bold tracking-tight">Request<span className="text-gradient-neon">ify</span></span>
    </div>
  );
}
