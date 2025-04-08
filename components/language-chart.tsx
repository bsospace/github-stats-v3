"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

// Generate a color based on language name
const stringToColor = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  let color = "#"
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff
    color += ("00" + value.toString(16)).substr(-2)
  }
  return color
}

interface LanguageChartProps {
  languages: Record<string, number>
}

export function LanguageChart({ languages }: LanguageChartProps) {
  // Convert languages object to array and calculate percentages
  const languagesArray = Object.entries(languages).map(([name, bytes]) => ({
    name,
    value: bytes,
    color: stringToColor(name),
  }))

  // Sort by value (bytes) in descending order
  languagesArray.sort((a, b) => b.value - a.value)

  // Calculate total bytes
  const totalBytes = languagesArray.reduce((sum, item) => sum + item.value, 0)

  // Format bytes to human-readable format
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.value / totalBytes) * 100).toFixed(1)
      return (
        <div className="bg-background p-2 border rounded shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">
            {formatBytes(data.value)} ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      {languagesArray.length > 0 ? (
        <PieChart>
          <Pie
            data={languagesArray}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {languagesArray.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            formatter={(value) => {
              const lang = languagesArray.find((l) => l.name === value)
              const percentage = lang ? ((lang.value / totalBytes) * 100).toFixed(1) : "0"
              return (
                <span className="text-sm">
                  {value} ({percentage}%)
                </span>
              )
            }}
          />
        </PieChart>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No language data available</p>
        </div>
      )}
    </ResponsiveContainer>
  )
}
