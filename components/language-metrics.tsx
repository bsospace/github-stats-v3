"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  Legend,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { FileCode, Code, Braces } from "lucide-react"

interface LanguageMetric {
  language: string
  lines: number
  files: number
  complexity: number
  averageComplexity: number
  color: string
}

interface LanguageMetricsProps {
  languageMetrics: LanguageMetric[]
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

export function LanguageMetrics({ languageMetrics }: LanguageMetricsProps) {
  // Ensure we have data
  if (!languageMetrics || languageMetrics.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No language metrics available</p>
      </div>
    )
  }

  // Sort languages by lines of code (descending)
  const sortedByLines = [...languageMetrics].sort((a, b) => b.lines - a.lines)

  // Sort languages by complexity (descending)
  const sortedByComplexity = [...languageMetrics].sort((a, b) => b.complexity - a.complexity)

  // Sort languages by average complexity (descending)
  const sortedByAvgComplexity = [...languageMetrics].sort((a, b) => b.averageComplexity - a.averageComplexity)

  // Format large numbers
  const formatNumber = (num: number) => {
    return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString()
  }

  // Custom tooltip for bar charts
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

  // Custom tooltip for scatter chart
  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background p-2 border rounded shadow-sm">
          <p className="font-medium">{data.language}</p>
          <p className="text-sm">Lines: {data.lines.toLocaleString()}</p>
          <p className="text-sm">Complexity: {data.complexity.toFixed(2)}</p>
          <p className="text-sm">Files: {data.files}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lines">Lines of Code</TabsTrigger>
          <TabsTrigger value="complexity">Complexity</TabsTrigger>
          <TabsTrigger value="correlation">Correlation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Code className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Total Languages</div>
                    <div className="text-2xl font-bold">{languageMetrics.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileCode className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Total Lines</div>
                    <div className="text-2xl font-bold">
                      {languageMetrics.reduce((sum, lang) => sum + lang.lines, 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Braces className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Avg. Complexity</div>
                    <div className="text-2xl font-bold">
                      {(
                        languageMetrics.reduce((sum, lang) => sum + lang.complexity, 0) / languageMetrics.length
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Top Languages by Lines of Code</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedByLines.slice(0, 6).map((lang) => (
                <Card key={lang.language}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{lang.language}</div>
                      <Badge style={{ backgroundColor: lang.color }}>{formatNumber(lang.lines)} lines</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Files</span>
                        <span>{lang.files}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Complexity</span>
                        <span>{lang.complexity.toFixed(1)}</span>
                      </div>
                      <div className="flex flex-col col-span-2">
                        <span className="text-muted-foreground">Avg. Complexity per File</span>
                        <span>{lang.averageComplexity.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="lines">
          <Card>
            <CardHeader>
              <CardTitle>Lines of Code by Language</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedByLines.slice(0, 15)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="language" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="lines" name="Lines of Code" radius={[0, 4, 4, 0]}>
                    {sortedByLines.slice(0, 15).map((entry) => (
                      <Cell key={`cell-${entry.language}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complexity">
          <Card>
            <CardHeader>
              <CardTitle>Complexity by Language</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedByAvgComplexity.slice(0, 15)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="language" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="averageComplexity" name="Average Complexity" radius={[0, 4, 4, 0]}>
                    {sortedByAvgComplexity.slice(0, 15).map((entry) => (
                      <Cell key={`cell-${entry.language}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation">
          <Card>
            <CardHeader>
              <CardTitle>Lines vs. Complexity Correlation</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="lines"
                    name="Lines of Code"
                    label={{ value: "Lines of Code", position: "insideBottomRight", offset: -5 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="averageComplexity"
                    name="Average Complexity"
                    label={{ value: "Average Complexity", angle: -90, position: "insideLeft" }}
                  />
                  <ZAxis type="number" dataKey="files" range={[50, 400]} />
                  <Tooltip content={<ScatterTooltip />} />
                  <Legend />
                  <Scatter name="Languages" data={languageMetrics} fill="#8884d8">
                    {languageMetrics.map((entry) => (
                      <Cell key={`cell-${entry.language}`} fill={entry.color} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
