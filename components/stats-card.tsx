import type { ReactNode } from "react"

interface StatsCardProps {
  icon: ReactNode
  label: string
  value: string
  variant?: "default" | "accent" | "mission"
  subtitle?: string
}

export function StatsCard({ icon, label, value, variant = "default", subtitle }: StatsCardProps) {
  const variants = {
    default: "bg-card border border-border shadow-soft",
    accent: "bg-accent/40 border border-accent/20 shadow-glow-accent",
    mission: "bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20",
  }

  return (
    <div
      className={`rounded-2xl p-3.5 flex flex-col gap-2 transition-all duration-300 hover:scale-[1.02] ${variants[variant]}`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            variant === "accent" ? "bg-accent/50" : variant === "mission" ? "bg-primary/20" : "bg-muted"
          }`}
        >
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
        <p className="text-lg font-bold text-foreground mt-0.5">{value}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
