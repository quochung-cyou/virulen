"use client"

interface WeekProgressProps {
  data: number[][]
}

const days = ["M", "T", "W", "T", "F", "S", "S"]
const fullDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function WeekProgress({ data }: WeekProgressProps) {
  const getColor = (level: number) => {
    switch (level) {
      case 0:
        return "bg-muted/50"
      case 1:
        return "bg-chart-3/60"
      case 2:
        return "bg-chart-2/80"
      case 3:
        return "bg-chart-1"
      default:
        return "bg-muted/50"
    }
  }

  const today = new Date().getDay()
  const todayIndex = today === 0 ? 6 : today - 1

  return (
    <div className="bg-card rounded-2xl p-3.5 border border-border shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm text-foreground">Weekly Activity</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-chart-1" />
            <span className="text-[10px] text-muted-foreground">Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day, dayIndex) => (
          <div key={`${day}-${dayIndex}`} className="flex flex-col items-center gap-1.5">
            {data[dayIndex]?.map((level, rowIndex) => (
              <div
                key={rowIndex}
                className={`w-5 h-5 rounded-md transition-all duration-300 hover:scale-110 ${getColor(level)}`}
                style={{
                  opacity: level === 0 ? 0.4 : 0.6 + level * 0.13,
                }}
              />
            ))}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all ${
                dayIndex === todayIndex ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              {dayIndex === todayIndex ? new Date().getDate() : fullDays[dayIndex].slice(0, 1)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
