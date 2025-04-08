"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react"

interface UserLineStat {
  user: string
  avatar: string
  totalAdded: number
  totalDeleted: number
  netContribution: number
  linesByLanguage: Record<
    string,
    {
      added: number
      deleted: number
      net: number
    }
  >
}

interface UserLineStatsProps {
  userLineStats: UserLineStat[] | undefined
  currentBranch?: string
}

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

export function UserLineStats({ userLineStats, currentBranch = "" }: UserLineStatsProps) {
  // Ensure userLineStats is an array and has items
  const validStats = Array.isArray(userLineStats) && userLineStats.length > 0

  if (!validStats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No user line data available for {currentBranch === "all-branches" ? "any branch" : `branch: ${currentBranch}`}
        </p>
      </div>
    )
  }

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-green-500">Added: {payload[0]?.value.toLocaleString()}</p>
          <p className="text-sm text-red-500">Deleted: {payload[1]?.value.toLocaleString()}</p>
          <p className="text-sm">Net: {(payload[0]?.value - payload[1]?.value).toLocaleString()}</p>
        </div>
      )
    }
    return null
  }

  // Custom tooltip for language breakdown
  const LanguageTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-sm">{payload[0]?.value.toLocaleString()} lines</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue={userLineStats[0]?.user}>
        <TabsList className="mb-4 flex flex-wrap gap-1">
          {userLineStats.map((stat) => (
            <TabsTrigger key={stat.user} value={stat.user}>
              {stat.user}
            </TabsTrigger>
          ))}
        </TabsList>

        {userLineStats.map((stat) => (
          <TabsContent key={stat.user} value={stat.user}>
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={stat.avatar} alt={stat.user} />
                <AvatarFallback>{stat.user.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{stat.user}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="text-green-500 flex items-center">
                    <ArrowUpIcon className="h-3 w-3 mr-1" />
                    {stat.totalAdded.toLocaleString()} added
                  </span>
                  <span className="text-red-500 flex items-center">
                    <ArrowDownIcon className="h-3 w-3 mr-1" />
                    {stat.totalDeleted.toLocaleString()} deleted
                  </span>
                  <span className="flex items-center">
                    <MinusIcon className="h-3 w-3 mr-1" />
                    {stat.netContribution.toLocaleString()} net
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-4">Line Contributions</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: "Lines",
                            added: stat.totalAdded,
                            deleted: stat.totalDeleted,
                          },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="added" name="Added" fill="#22c55e" />
                        <Bar dataKey="deleted" name="Deleted" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-4">Lines by Language</h3>
                  <div className="h-64">
                    {Object.keys(stat.linesByLanguage).length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Object.entries(stat.linesByLanguage).map(([name, data]) => ({
                            language: name,
                            lines: data.net,
                            color: stringToColor(name),
                          }))}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="language" tick={{ fontSize: 12 }} width={80} />
                          <Tooltip content={<LanguageTooltip />} />
                          <Bar dataKey="lines" radius={[0, 4, 4, 0]}>
                            {Object.keys(stat.linesByLanguage).map((name) => (
                              <Cell
                                key={`cell-${name}`}
                                fill={stat.linesByLanguage[name].net >= 0 ? stringToColor(name) : "#ef4444"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No language line data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
