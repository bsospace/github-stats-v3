"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UserLanguageStat {
  user: string
  avatar: string
  languages: Record<string, number>
}

interface UserLanguageStatsProps {
  userLanguageStats: UserLanguageStat[]
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

export function UserLanguageStats({ userLanguageStats, currentBranch = "" }: UserLanguageStatsProps) {
  // Ensure userLanguageStats is an array and has items
  const validStats = Array.isArray(userLanguageStats) && userLanguageStats.length > 0

  if (!validStats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No user language data available for{" "}
          {currentBranch === "all-branches" ? "any branch" : `branch: ${currentBranch}`}
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
          <p className="text-sm">{payload[0].value} files</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue={userLanguageStats[0]?.user}>
        <TabsList className="mb-4 flex flex-wrap gap-1">
          {userLanguageStats.map((stat) => (
            <TabsTrigger key={stat.user} value={stat.user}>
              {stat.user}
            </TabsTrigger>
          ))}
        </TabsList>

        {userLanguageStats.map((stat) => (
          <TabsContent key={stat.user} value={stat.user}>
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={stat.avatar} alt={stat.user} />
                <AvatarFallback>{stat.user.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{stat.user}</div>
                <div className="text-sm text-muted-foreground">{Object.keys(stat.languages).length} languages used</div>
              </div>
            </div>

            <div className="h-80">
              {Object.keys(stat.languages).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(stat.languages).map(([name, count]) => ({
                      language: name,
                      count,
                      color: stringToColor(name),
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="language" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {Object.entries(stat.languages).map(([name]) => (
                        <Cell key={`cell-${name}`} fill={stringToColor(name)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No language data available for this user</p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
