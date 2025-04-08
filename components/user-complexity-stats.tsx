"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface UserComplexityStat {
  user: string
  avatar: string
  totalComplexity: number
  averageComplexity: number
  totalFiles: number
  complexityByLanguage: Record<
    string,
    {
      totalScore: number
      fileCount: number
      averageScore: number
    }
  >
  mostComplexFiles: Array<{
    filename: string
    language: string
    complexityScore: number
  }>
}

interface UserComplexityStatsProps {
  userComplexityStats: UserComplexityStat[] | undefined
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

export function UserComplexityStats({ userComplexityStats, currentBranch = "" }: UserComplexityStatsProps) {
  // Ensure userComplexityStats is an array and has items
  const validStats = Array.isArray(userComplexityStats) && userComplexityStats.length > 0

  if (!validStats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No user complexity data available for{" "}
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
          <p className="text-sm">{payload[0].value.toFixed(2)} complexity score</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue={userComplexityStats[0]?.user}>
        <TabsList className="mb-4 flex flex-wrap gap-1">
          {userComplexityStats.map((stat) => (
            <TabsTrigger key={stat.user} value={stat.user}>
              {stat.user}
            </TabsTrigger>
          ))}
        </TabsList>

        {userComplexityStats.map((stat) => (
          <TabsContent key={stat.user} value={stat.user}>
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={stat.avatar} alt={stat.user} />
                <AvatarFallback>{stat.user.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{stat.user}</div>
                <div className="text-sm text-muted-foreground">
                  Average complexity: {stat.averageComplexity.toFixed(2)} across {stat.totalFiles} files
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-4">Complexity by Language</h3>
                  <div className="h-64">
                    {Object.keys(stat.complexityByLanguage).length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Object.entries(stat.complexityByLanguage).map(([name, data]) => ({
                            language: name,
                            complexity: data.averageScore,
                            color: stringToColor(name),
                          }))}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="language" tick={{ fontSize: 12 }} width={80} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="complexity" radius={[0, 4, 4, 0]}>
                            {Object.keys(stat.complexityByLanguage).map((name) => (
                              <Cell key={`cell-${name}`} fill={stringToColor(name)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No language complexity data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-4">Most Complex Files</h3>
                  <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                    {stat.mostComplexFiles && stat.mostComplexFiles.length > 0 ? (
                      stat.mostComplexFiles.map((file, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-xs truncate max-w-[200px]">{file.filename}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{file.language}</span>
                            </div>
                            <span className="text-xs font-medium">Score: {file.complexityScore.toFixed(1)}</span>
                          </div>
                          <Progress
                            value={(file.complexityScore / (stat.mostComplexFiles[0]?.complexityScore || 1)) * 100}
                            className="h-1.5"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No file complexity data available</p>
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
