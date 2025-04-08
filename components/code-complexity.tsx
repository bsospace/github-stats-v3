"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts"
import { Code, FileCode, TrendingUp } from "lucide-react"

interface CodeComplexityProps {
  data: {
    totalLines: number
    languageLines: Record<string, number>
    fileComplexity: Array<{
      filename: string
      language: string
      additions: number
      deletions: number
      changes: number
      complexityScore: number
    }>
    complexityByLanguage: Record<
      string,
      {
        totalScore: number
        fileCount: number
        averageScore: number
      }
    >
    complexityTrend: Array<{
      date: string
      complexity: number
      changes: number
    }>
  }
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

export function CodeComplexity({ data }: CodeComplexityProps) {
  // Prepare data for language lines chart
  const languageLinesData = Object.entries(data.languageLines)
    .map(([language, lines]) => ({
      language,
      lines,
      color: stringToColor(language),
    }))
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 10) // Top 10 languages

  // Prepare data for complexity by language chart
  const complexityByLanguageData = Object.entries(data.complexityByLanguage)
    .map(([language, { averageScore }]) => ({
      language,
      complexity: averageScore,
      color: stringToColor(language),
    }))
    .sort((a, b) => b.complexity - a.complexity)
    .slice(0, 10) // Top 10 languages

  // Prepare data for most complex files
  const mostComplexFiles = [...data.fileComplexity].sort((a, b) => b.complexityScore - a.complexityScore).slice(0, 10) // Top 10 most complex files

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            {payload[0].name}: {payload[0].value.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Code className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Total Lines of Code</div>
                <div className="text-2xl font-bold">{data.totalLines.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileCode className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Files Analyzed</div>
                <div className="text-2xl font-bold">{data.fileComplexity.length.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Average Complexity</div>
                <div className="text-2xl font-bold">
                  {data.fileComplexity.length > 0
                    ? (
                        data.fileComplexity.reduce((sum, file) => sum + file.complexityScore, 0) /
                        data.fileComplexity.length
                      ).toFixed(2)
                    : "N/A"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="lines">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lines">Lines by Language</TabsTrigger>
          <TabsTrigger value="complexity">Complexity by Language</TabsTrigger>
          <TabsTrigger value="trend">Complexity Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="lines" className="mt-4">
          <Card>
            <CardContent className="p-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={languageLinesData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="language" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="lines" name="Lines of Code" radius={[0, 4, 4, 0]}>
                    {languageLinesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complexity" className="mt-4">
          <Card>
            <CardContent className="p-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={complexityByLanguageData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="language" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="complexity" name="Complexity Score" radius={[0, 4, 4, 0]}>
                    {complexityByLanguageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend" className="mt-4">
          <Card>
            <CardContent className="p-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.complexityTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return `${date.getMonth() + 1}/${date.getDate()}`
                    }}
                  />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="complexity"
                    name="Complexity Score"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                  <Line yAxisId="right" type="monotone" dataKey="changes" name="Code Changes" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Most Complex Files</h3>
          <div className="space-y-4">
            {mostComplexFiles.map((file, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate max-w-[300px]">{file.filename}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{file.language}</span>
                  </div>
                  <span className="text-sm font-medium">Score: {file.complexityScore.toFixed(1)}</span>
                </div>
                <Progress value={(file.complexityScore / mostComplexFiles[0].complexityScore) * 100} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Changes: {file.changes}</span>
                  <span>Additions: {file.additions}</span>
                  <span>Deletions: {file.deletions}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
