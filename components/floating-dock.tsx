"use client"

import { usePathname, useRouter } from "next/navigation"
import { Home, Camera, BookOpen, Star, Target } from "lucide-react"

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: BookOpen, label: "Cards", path: "/cards" },
  { icon: Camera, label: "Scan", path: "/scan", isCenter: true },
  { icon: Target, label: "Quests", path: "/quests/explorer" },
  { icon: Star, label: "Favorites", path: "/favorites" },
]

export function FloatingDock() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 safe-area-inset-bottom" aria-label="Bottom navigation">
      <div className="glass rounded-full px-2 py-1.5 flex items-center gap-0.5 shadow-soft border border-border/50 backdrop-blur-xl bg-background/80">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`)
          const Icon = item.icon

          if (item.isCenter) {
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="relative mx-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-full"
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {/* Outer glow ring */}
                <div
                  className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
                    isActive ? "opacity-100 animate-pulse-ring bg-primary/30" : "opacity-0"
                  }`}
                />
                {/* Main button */}
                <div
                  className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? "bg-primary shadow-glow-primary scale-110"
                      : "bg-primary/90 hover:bg-primary hover:scale-105"
                  }`}
                >
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
              </button>
            )
          }

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center w-11 h-11 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                isActive
                  ? "bg-secondary text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-4.5 h-4.5" />
              <span className="text-[9px] font-medium mt-0">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
