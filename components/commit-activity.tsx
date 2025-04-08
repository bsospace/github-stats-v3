"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface CommitActivityProps {
  commitData: any // Using any to handle different possible data formats
}

export function CommitActivity({ commitData }: CommitActivityProps) {
  // Check if commitData is an array and has data
  const isValidData = Array.isArray(commitData) && commitData.length > 0

  // Format the data for the chart
  const formattedData = isValidData
    ? commitData.map((week) => {
        // Convert Unix timestamp to date
        const date = new Date(week.week * 1000)
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`

        return {
          date: formattedDate,
          commits: week.total,
          timestamp: week.week,
        }
      })
    : []

  // Sort by timestamp
  formattedData.sort((a, b) => a.timestamp - b.timestamp)

  // Take only the last 52 weeks (1 year) if we have more data
  const yearData = formattedData.slice(-52)

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-sm">{payload[0].value} commits</p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      {yearData.length > 0 ? (
        <AreaChart
          data={yearData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value, index) => {
              // Show fewer ticks for better readability
              return index % 8 === 0 ? value : ""
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="commits" stroke="#8884d8" fill="#8884d8" />
        </AreaChart>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No commit activity data available</p>
        </div>
      )}
    </ResponsiveContainer>
  )
}
