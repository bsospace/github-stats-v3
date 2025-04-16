"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, GitBranch, GitFork, Star, Users, Eye, EyeOff, GitMerge, Calendar } from "lucide-react"
import { LanguageChart } from "@/components/language-chart"
import { CommitActivity } from "@/components/commit-activity"
import { ContributorsList } from "@/components/contributors-list"
import { BranchList } from "@/components/branch-list"
import { UserLanguageStats } from "@/components/user-language-stats"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DateRangePicker } from "@/components/date-range-picker"
import { CodeComplexity } from "@/components/code-complexity"
import { format, subMonths } from "date-fns"
import { UserComplexityStats } from "@/components/user-complexity-stats"
import { UserLineStats } from "@/components/user-line-stats"
import { LanguageMetrics } from "@/components/language-metrics"
import { BranchSelector } from "@/components/branch-selector"

// Define a type for date range
type DateRange = {
  from: Date | undefined
  to: Date | undefined
}

// Function to generate a unique color for each language
function stringToColor(str: string) {
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

// Add this function after the stringToColor function and before the Home component:
function BranchBadge({ isAggregateView, currentBranch }: { isAggregateView: boolean; currentBranch: string }) {
  return (
    <Badge variant="outline" className={`px-3 py-1 text-sm ${isAggregateView ? "bg-primary/10" : ""}`}>
      {isAggregateView ? (
        <>
          <GitMerge className="h-3.5 w-3.5 mr-1.5" />
          All Branches
        </>
      ) : (
        <>
          <GitBranch className="h-3.5 w-3.5 mr-1.5" />
          {currentBranch}
        </>
      )}
    </Badge>
  )
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("")
  const [token, setToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [repoData, setRepoData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentBranch, setCurrentBranch] = useState<string>("")
  const [activeTab, setActiveTab] = useState("languages")
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number } | null>(null)
  const [isAggregateView, setIsAggregateView] = useState(false)
  const [complexityData, setComplexityData] = useState<any>(null)

  // Initialize date range to last 3 months by default
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  })

  async function fetchAllCommits(owner: string, repo: string, branch: string, headers: HeadersInit) {
    let page = 1
    const allCommits: any[] = []
    let keepFetching = true

    while (keepFetching) {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=100&page=${page}`,
        { headers }
      )

      if (!response.ok) break

      const data = await response.json()

      allCommits.push(...data)
      page++

      // ถ้าค่าที่ดึงมา < 100 แสดงว่าหน้านี้คือหน้าสุดท้าย
      if (data.length < 100) keepFetching = false
    }

    return allCommits
  }

  async function fetchUserCommitsAllPages(owner: string, repo: string, login: string, branch: string, headers: HeadersInit, dateRange: DateRange) {
    let page = 1
    const allCommits: any[] = []
    let hasMore = true

    while (hasMore) {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?author=${login}&sha=${branch}&per_page=100&page=${page}`,
        { headers }
      )

      if (!res.ok) break

      const commits = await res.json()

      // filter by date range here (optional optimization)
      const filtered = commits.filter((commit: any) => {
        const commitDate = new Date(commit.commit.author.date)
        return (
          (!dateRange.from || commitDate >= dateRange.from) &&
          (!dateRange.to || commitDate <= dateRange.to)
        )
      })

      allCommits.push(...filtered)

      if (commits.length < 100) {
        hasMore = false
      } else {
        page++
      }
    }

    return allCommits
  }



  const fetchRepoStats = async (branchName?: string, scanAllBranches = false) => {
    setLoading(true)
    setError(null)
    setScanProgress(null)
    setIsAggregateView(scanAllBranches)

    try {
      // Extract owner and repo from URL
      const urlPattern = /github\.com\/([^/]+)\/([^/]+)/
      const match = repoUrl.match(urlPattern)

      if (!match) {
        throw new Error("Invalid GitHub repository URL")
      }

      const [, owner, repo] = match

      // Set up headers for API requests
      const headers: HeadersInit = {}
      if (token) {
        headers.Authorization = `token ${token}`
      }

      // Fetch basic repo data
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })
      if (!repoResponse.ok) {
        throw new Error(`Repository not found or API rate limit exceeded (${repoResponse.status})`)
      }
      const repoInfo = await repoResponse.json()

      console.log("Repo response:", repoInfo)

      // Fetch branches - this is repository-wide
      let branches = []
      try {
        const branchesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, { headers })


        if (branchesResponse.ok) {
          branches = await branchesResponse.json()
          console.log("Repo branchesResponse:", branches)
        } else {
          console.warn("Failed to fetch branches:", branchesResponse.status)
        }
      } catch (branchErr) {
        console.warn("Error fetching branches:", branchErr)
      }

      // // Prepare date range parameters for API requests
      // const fromDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined
      // const toDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined

      // // Date range query parameter for GitHub API
      // const dateQuery = fromDate && toDate ? `&since=${fromDate}T00:00:00Z&until=${toDate}T23:59:59Z` : ""

      // If scanning all branches, we'll process each branch and aggregate the data
      if (scanAllBranches && branches.length > 0) {
        // Set the current branch to indicate we're viewing all branches
        setCurrentBranch("all-branches")

        // Initialize aggregate data structures
        const allContributors = new Map()
        const allCommitActivity = new Map()
        const allLanguages: Record<string, number> = {}
        const allUserLanguages = new Map()
        const allUserLines = new Map()
        const codeComplexityData: any = {
          totalLines: 0,
          languageLines: {},
          fileComplexity: [],
          complexityByLanguage: {},
          complexityTrend: [],
          userComplexityStats: new Map(), // Add this line
        }

        // Set of processed commit SHAs to avoid duplicates
        const processedCommits = new Set()

        // Process each branch
        for (let i = 0; i < branches.length; i++) {
          const branch = branches[i]

          // Update progress
          setScanProgress({
            current: i + 1,
            total: branches.length,
          })

          try {
            // Fetch commits for this branch with date range filter
            const commitsResponse = await fetch(
              `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch.name}?per_page=100`,
              { headers },
            )

            if (commitsResponse.ok) {
              const commits = await commitsResponse.json()

              console.log("commits response:", commits)

              // Process commits for this branch
              for (const commit of commits) {
                // Skip if we've already processed this commit
                if (processedCommits.has(commit.sha)) continue
                processedCommits.add(commit.sha)

                // Update contributor stats
                const author = commit.author
                if (author) {
                  const login = author.login
                  const avatar_url = author.avatar_url
                  const html_url = author.html_url

                  if (allContributors.has(login)) {
                    allContributors.get(login).contributions++
                  } else {
                    allContributors.set(login, {
                      login,
                      avatar_url,
                      html_url,
                      contributions: 1,
                    })
                  }
                }

                // Update commit activity
                const date = new Date(commit.commit.author.date)

                // Skip if outside date range
                if ((dateRange.from && date < dateRange.from) || (dateRange.to && date > dateRange.to)) {
                  continue
                }

                // Get the start of the week (Sunday)
                const weekStart = new Date(date)
                weekStart.setDate(date.getDate() - date.getDay())
                weekStart.setHours(0, 0, 0, 0)

                const weekTimestamp = Math.floor(weekStart.getTime() / 1000)

                if (allCommitActivity.has(weekTimestamp)) {
                  allCommitActivity.get(weekTimestamp).total++
                } else {
                  allCommitActivity.set(weekTimestamp, {
                    week: weekTimestamp,
                    total: 1,
                    days: [0, 0, 0, 0, 0, 0, 0], // Placeholder for daily data
                  })
                }

                // Fetch commit details to get language data and code complexity
                try {
                  const commitDetailResponse = await fetch(
                    `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`,
                    { headers },
                  )

                  if (commitDetailResponse.ok) {
                    const commitDetail = await commitDetailResponse.json()

                    // Process files for language stats and code complexity
                    for (const file of commitDetail.files || []) {
                      const extension = file.filename.split(".").pop()?.toLowerCase() || "unknown"

                      // Map common extensions to languages
                      let language = extension
                      if (extension === "js") language = "JavaScript"
                      else if (extension === "ts") language = "TypeScript"
                      else if (extension === "py") language = "Python"
                      else if (extension === "java") language = "Java"
                      else if (extension === "rb") language = "Ruby"
                      else if (extension === "go") language = "Go"
                      else if (extension === "php") language = "PHP"
                      else if (extension === "cs") language = "C#"
                      else if (extension === "cpp" || extension === "cc") language = "C++"
                      else if (extension === "c") language = "C"
                      else if (extension === "html") language = "HTML"
                      else if (extension === "css") language = "CSS"
                      else if (extension === "scss" || extension === "sass") language = "SASS"
                      else if (extension === "jsx") language = "React"
                      else if (extension === "tsx") language = "React/TypeScript"
                      else if (extension === "md") language = "Markdown"
                      else if (extension === "json") language = "JSON"
                      else if (extension === "yml" || extension === "yaml") language = "YAML"

                      // Update global language stats
                      allLanguages[language] = (allLanguages[language] || 0) + (file.changes || 1)

                      // Update user language stats
                      if (author) {
                        const login = author.login

                        if (!allUserLanguages.has(login)) {
                          allUserLanguages.set(login, {
                            user: login,
                            avatar: author.avatar_url,
                            languages: {},
                          })
                        }

                        const userStats = allUserLanguages.get(login)
                        userStats.languages[language] = (userStats.languages[language] || 0) + 1
                      }

                      // Update user line stats
                      if (author) {
                        const login = author.login

                        if (!allUserLines.has(login)) {
                          allUserLines.set(login, {
                            user: login,
                            avatar: author.avatar_url,
                            totalAdded: 0,
                            totalDeleted: 0,
                            netContribution: 0,
                            linesByLanguage: {},
                          })
                        }

                        const userLineStats = allUserLines.get(login)
                        userLineStats.totalAdded += file.additions || 0
                        userLineStats.totalDeleted += file.deletions || 0
                        userLineStats.netContribution = userLineStats.totalAdded - userLineStats.totalDeleted

                        if (!userLineStats.linesByLanguage[language]) {
                          userLineStats.linesByLanguage[language] = {
                            added: 0,
                            deleted: 0,
                            net: 0,
                          }
                        }

                        userLineStats.linesByLanguage[language].added += file.additions || 0
                        userLineStats.linesByLanguage[language].deleted += file.deletions || 0
                        userLineStats.linesByLanguage[language].net =
                          userLineStats.linesByLanguage[language].added -
                          userLineStats.linesByLanguage[language].deleted
                      }

                      // Calculate code complexity metrics
                      const additions = file.additions || 0
                      const deletions = file.deletions || 0
                      const changes = file.changes || 0

                      // Update total lines of code
                      codeComplexityData.totalLines += additions - deletions

                      // Update lines by language
                      codeComplexityData.languageLines[language] =
                        (codeComplexityData.languageLines[language] || 0) + (additions - deletions)

                      // Calculate a basic complexity score based on file size and changes
                      // This is a simplified metric - real complexity would require parsing the code
                      let complexityScore = 1

                      // More changes might indicate more complex code
                      if (changes > 100) complexityScore += 2
                      else if (changes > 50) complexityScore += 1

                      // Certain file types tend to have more complex code
                      if (["JavaScript", "TypeScript", "Java", "C++", "C#", "Python"].includes(language)) {
                        complexityScore += 1
                      }

                      // Update user complexity stats
                      if (author) {
                        const login = author.login

                        if (!codeComplexityData.userComplexityStats.has(login)) {
                          codeComplexityData.userComplexityStats.set(login, {
                            user: login,
                            avatar: author.avatar_url,
                            totalComplexity: 0,
                            totalFiles: 0,
                            averageComplexity: 0,
                            complexityByLanguage: {},
                            mostComplexFiles: [],
                          })
                        }

                        const userStats = codeComplexityData.userComplexityStats.get(login)
                        userStats.totalComplexity += complexityScore
                        userStats.totalFiles += 1
                        userStats.averageComplexity = userStats.totalComplexity / userStats.totalFiles

                        // Update complexity by language for this user
                        if (!userStats.complexityByLanguage[language]) {
                          userStats.complexityByLanguage[language] = {
                            totalScore: 0,
                            fileCount: 0,
                            averageScore: 0,
                          }
                        }

                        userStats.complexityByLanguage[language].totalScore += complexityScore
                        userStats.complexityByLanguage[language].fileCount += 1
                        userStats.complexityByLanguage[language].averageScore =
                          userStats.complexityByLanguage[language].totalScore /
                          userStats.complexityByLanguage[language].fileCount

                        // Add to most complex files for this user
                        userStats.mostComplexFiles.push({
                          filename: file.filename,
                          language,
                          complexityScore,
                        })

                        // Sort and limit to top 10 most complex files
                        userStats.mostComplexFiles.sort((a, b) => b.complexityScore - a.complexityScore)
                        if (userStats.mostComplexFiles.length > 10) {
                          userStats.mostComplexFiles = userStats.mostComplexFiles.slice(0, 10)
                        }
                      }

                      // Add to file complexity list
                      codeComplexityData.fileComplexity.push({
                        filename: file.filename,
                        language,
                        additions,
                        deletions,
                        changes,
                        complexityScore,
                      })

                      // Update complexity by language
                      if (!codeComplexityData.complexityByLanguage[language]) {
                        codeComplexityData.complexityByLanguage[language] = {
                          totalScore: 0,
                          fileCount: 0,
                          averageScore: 0,
                        }
                      }

                      codeComplexityData.complexityByLanguage[language].totalScore += complexityScore
                      codeComplexityData.complexityByLanguage[language].fileCount += 1
                      codeComplexityData.complexityByLanguage[language].averageScore =
                        codeComplexityData.complexityByLanguage[language].totalScore /
                        codeComplexityData.complexityByLanguage[language].fileCount

                      // Add to complexity trend
                      const dateStr = format(date, "yyyy-MM-dd")
                      const existingTrendIndex = codeComplexityData.complexityTrend.findIndex(
                        (item: any) => item.date === dateStr,
                      )

                      if (existingTrendIndex >= 0) {
                        codeComplexityData.complexityTrend[existingTrendIndex].complexity += complexityScore
                        codeComplexityData.complexityTrend[existingTrendIndex].changes += changes
                      } else {
                        codeComplexityData.complexityTrend.push({
                          date: dateStr,
                          complexity: complexityScore,
                          changes,
                        })
                      }
                    }
                  }
                } catch (detailErr) {
                  console.warn(`Error fetching details for commit ${commit.sha}:`, detailErr)
                }
              }
            }
          } catch (branchErr) {
            console.warn(`Error processing branch ${branch.name}:`, branchErr)
          }
        }

        // Convert maps to arrays for the UI
        const contributors = Array.from(allContributors.values())
          .sort((a, b) => b.contributions - a.contributions)
          .slice(0, 10) // Top 10 contributors

        const commitActivity = Array.from(allCommitActivity.values()).sort((a, b) => a.week - b.week)

        const userLanguageStats = Array.from(allUserLanguages.values()).sort((a, b) => {
          const aTotal = Object.values(a.languages).reduce((sum: any, val: any) => sum + val, 0)
          const bTotal = Object.values(b.languages).reduce((sum: any, val: any) => sum + val, 0)
          return bTotal - aTotal
        })
        //.slice(0, 5) // Top 5 users

        const userLineStats = Array.from(allUserLines.values()).sort((a, b) => b.netContribution - a.netContribution)
        //.slice(0, 5) // Top 5 users

        // Sort complexity trend by date
        codeComplexityData.complexityTrend.sort(
          (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        )

        // Calculate average complexity for each language
        Object.keys(codeComplexityData.complexityByLanguage).forEach((lang) => {
          const langData = codeComplexityData.complexityByLanguage[lang]
          langData.averageScore = langData.totalScore / langData.fileCount
        })

        // Process user complexity stats
        if (codeComplexityData.userComplexityStats.size > 0) {
          // Convert map to array and sort by total complexity
          codeComplexityData.userComplexityStats = Array.from(codeComplexityData.userComplexityStats.values()).sort(
            (a, b) => b.totalComplexity - a.totalComplexity,
          )
          //.slice(0, 5) // Top 5 users
        }

        // Set the aggregated data
        setRepoData({
          ...repoInfo,
          languages: allLanguages,
          contributors,
          commitActivity,
          branches,
          userLanguageStats,
          userLineStats,
          currentBranch: "all-branches",
        })

        // Set code complexity data
        setComplexityData(codeComplexityData)

        // Clear progress indicator
        setScanProgress(null)
      } else {
        // Regular single branch scan
        // Set the current branch - if not specified, use the default branch from repo info
        const targetBranch = branchName || repoInfo.default_branch
        setCurrentBranch(targetBranch)

        // Fetch languages - this is repository-wide, not branch-specific
        const languagesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers })
        const languages = await languagesResponse.json()

        // Initialize code complexity data structure
        const codeComplexityData: any = {
          totalLines: 0,
          languageLines: {},
          fileComplexity: [],
          complexityByLanguage: {},
          complexityTrend: [],
          userComplexityStats: new Map(), // Add this line
        }

        // Fetch contributors for the specific branch with date range filter
        let contributors = []
        const commits = await fetchAllCommits(owner, repo, targetBranch, headers)
        try {
          // For branch-specific contributors, we need to get commits for that branch

          if (commits) {

            console.log("commits response:", commits)

            // Count contributions by author
            const contributorMap = new Map()

            for (const commit of commits) {
              const author = commit.author

              console.log('commit in for:', commit)
              if (!author) continue

              const login = author.login
              const avatar_url = author.avatar_url
              const html_url = author.html_url

              if (contributorMap.has(login)) {
                contributorMap.get(login).contributions++
              } else {
                contributorMap.set(login, {
                  login,
                  avatar_url,
                  html_url,
                  contributions: 1,
                })
              }

              // Fetch commit details for code complexity analysis
              try {
                const commitDetailResponse = await fetch(
                  `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`,
                  { headers },
                )

                if (commitDetailResponse.ok) {
                  const commitDetail = await commitDetailResponse.json()

                  // Process files for code complexity
                  for (const file of commitDetail.files || []) {
                    const extension = file.filename.split(".").pop()?.toLowerCase() || "unknown"



                    // Map common extensions to languages
                    // ใช้ filename แทน extension อย่างเดียว
                    let language = extension
                    const filename = file.filename.toLowerCase()

                    if (filename.endsWith("controller.php")) {
                      language = "PHP Controller"
                    } else if (filename.endsWith(".blade.php")) {
                      language = "PHP Blade"
                    }
                    else if (extension === "js") language = "JavaScript"
                    else if (extension === "ts") language = "TypeScript"
                    else if (extension === "py") language = "Python"
                    else if (extension === "java") language = "Java"
                    else if (extension === "rb") language = "Ruby"
                    else if (extension === "go") language = "Go"
                    else if (extension === "php") language = "PHP"
                    else if (extension === "cs") language = "C#"
                    else if (extension === "cpp" || extension === "cc") language = "C++"
                    else if (extension === "c") language = "C"
                    else if (extension === "html") language = "HTML"
                    else if (extension === "css") language = "CSS"
                    else if (extension === "scss" || extension === "sass") language = "SASS"
                    else if (extension === "jsx") language = "React"
                    else if (extension === "tsx") language = "React/TypeScript"
                    else if (extension === "md") language = "Markdown"
                    else if (extension === "json") language = "JSON"
                    else if (extension === "yml" || extension === "yaml") language = "YAML"

                    // Calculate code complexity metrics
                    const additions = file.additions || 0
                    const deletions = file.deletions || 0
                    const changes = file.changes || 0

                    // Update total lines of code
                    codeComplexityData.totalLines += additions - deletions

                    // Update lines by language
                    codeComplexityData.languageLines[language] =
                      (codeComplexityData.languageLines[language] || 0) + (additions - deletions)

                    // Calculate a basic complexity score
                    let complexityScore = 1

                    // More changes might indicate more complex code
                    if (changes > 100) complexityScore += 2
                    else if (changes > 50) complexityScore += 1

                    // Certain file types tend to have more complex code
                    if (["JavaScript", "TypeScript", "Java", "C++", "C#", "Python"].includes(language)) {
                      complexityScore += 1
                    }

                    // Update user complexity stats
                    if (author) {
                      const login = author.login

                      if (!codeComplexityData.userComplexityStats.has(login)) {
                        codeComplexityData.userComplexityStats.set(login, {
                          user: login,
                          avatar: author.avatar_url,
                          totalComplexity: 0,
                          totalFiles: 0,
                          averageComplexity: 0,
                          complexityByLanguage: {},
                          mostComplexFiles: [],
                        })
                      }

                      const userStats = codeComplexityData.userComplexityStats.get(login)
                      userStats.totalComplexity += complexityScore
                      userStats.totalFiles += 1
                      userStats.averageComplexity = userStats.totalComplexity / userStats.totalFiles

                      // Update complexity by language for this user
                      if (!userStats.complexityByLanguage[language]) {
                        userStats.complexityByLanguage[language] = {
                          totalScore: 0,
                          fileCount: 0,
                          averageScore: 0,
                        }
                      }

                      userStats.complexityByLanguage[language].totalScore += complexityScore
                      userStats.complexityByLanguage[language].fileCount += 1
                      userStats.complexityByLanguage[language].averageScore =
                        userStats.complexityByLanguage[language].totalScore /
                        userStats.complexityByLanguage[language].fileCount

                      // Add to most complex files for this user
                      userStats.mostComplexFiles.push({
                        filename: file.filename,
                        language,
                        complexityScore,
                      })

                      // Sort and limit to top 10 most complex files
                      userStats.mostComplexFiles.sort((a, b) => b.complexityScore - a.complexityScore)
                      if (userStats.mostComplexFiles.length > 10) {
                        userStats.mostComplexFiles = userStats.mostComplexFiles.slice(0, 10)
                      }
                    }

                    // Add to file complexity list
                    codeComplexityData.fileComplexity.push({
                      filename: file.filename,
                      language,
                      additions,
                      deletions,
                      changes,
                      complexityScore,
                    })

                    // Update complexity by language
                    if (!codeComplexityData.complexityByLanguage[language]) {
                      codeComplexityData.complexityByLanguage[language] = {
                        totalScore: 0,
                        fileCount: 0,
                        averageScore: 0,
                      }
                    }

                    codeComplexityData.complexityByLanguage[language].totalScore += complexityScore
                    codeComplexityData.complexityByLanguage[language].fileCount += 1

                    // Add to complexity trend
                    const dateStr = format(commitDate, "yyyy-MM-dd")
                    const existingTrendIndex = codeComplexityData.complexityTrend.findIndex(
                      (item: any) => item.date === dateStr,
                    )

                    if (existingTrendIndex >= 0) {
                      codeComplexityData.complexityTrend[existingTrendIndex].complexity += complexityScore
                      codeComplexityData.complexityTrend[existingTrendIndex].changes += changes
                    } else {
                      codeComplexityData.complexityTrend.push({
                        date: dateStr,
                        complexity: complexityScore,
                        changes,
                      })
                    }
                  }
                }
              } catch (detailErr) {
                console.warn(`Error fetching details for commit ${commit.sha}:`, detailErr)
              }
            }

            // Convert map to array and sort by contributions
            contributors = Array.from(contributorMap.values())
              .sort((a, b) => b.contributions - a.contributions)
              .slice(0, 10) // Top 10 contributors
          }
        } catch (contribErr) {
          console.warn("Error fetching contributors:", contribErr)
        }

        // Fetch commit activity for the specific branch with date range filter
        let commitActivity = []
        try {
          // For branch-specific commit activity, we need to get commits for that branch
          // and then aggregate them by week

          if (commits) {
            // Group commits by week
            const weekMap = new Map()

            for (const commit of commits) {
              const date = new Date(commit.commit.author.date)

              // Skip if outside date range
              if ((dateRange.from && date < dateRange.from) || (dateRange.to && date > dateRange.to)) {
                continue
              }

              // Get the start of the week (Sunday)
              const weekStart = new Date(date)
              weekStart.setDate(date.getDate() - date.getDay())
              weekStart.setHours(0, 0, 0, 0)

              const weekTimestamp = Math.floor(weekStart.getTime() / 1000)

              if (weekMap.has(weekTimestamp)) {
                weekMap.get(weekTimestamp).total++
              } else {
                weekMap.set(weekTimestamp, {
                  week: weekTimestamp,
                  total: 1,
                  days: [0, 0, 0, 0, 0, 0, 0], // Placeholder for daily data
                })
              }
            }

            // Convert map to array and sort by week
            commitActivity = Array.from(weekMap.values()).sort((a, b) => a.week - b.week)
          }
        } catch (commitErr) {
          console.warn("Error fetching commit activity:", commitErr)
        }

        // Fetch user language stats for the specific branch with date range filter
        let userLanguageStats = []
        try {
          // For each contributor, we'll fetch their commits on this branch and analyze languages
          const topContributors = contributors // Process all contributors

          const userLanguagePromises = topContributors.map(async (contributor: any) => {
            // Make sure we're using the targetBranch parameter here
            const userCommits = await fetchUserCommitsAllPages(owner, repo, contributor.login, targetBranch, headers, dateRange)


            if (!userCommits) {
              return {
                user: contributor.login,
                avatar: contributor.avatar_url,
                languages: {},
              }
            }

            // For each commit, fetch the files changed to determine languages
            const languageStats: Record<string, number> = {}

            // We'll limit to 10 most recent commits per user to avoid API rate limits
            const recentCommits = userCommits.slice(0, 10)

            for (const commit of recentCommits) {
              try {
                const commitDetailResponse = await fetch(
                  `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`,
                  { headers },
                )

                if (commitDetailResponse.ok) {
                  const commitDetail = await commitDetailResponse.json()

                  // Count file extensions as a proxy for languages
                  for (const file of commitDetail.files || []) {
                    const extension = file.filename.split(".").pop()?.toLowerCase() || "unknown"

                    // Map common extensions to languages
                    let language = extension
                    const filename = file.filename.toLowerCase()

                    if (filename.endsWith("controller.php")) {
                      language = "PHP Controller"
                    } else if (filename.endsWith(".blade.php")) {
                      language = "PHP Blade"
                    } else if (extension === "php") language = "PHP"
                    if (extension === "js") language = "JavaScript"
                    else if (extension === "ts") language = "TypeScript"
                    else if (extension === "py") language = "Python"
                    else if (extension === "java") language = "Java"
                    else if (extension === "rb") language = "Ruby"
                    else if (extension === "go") language = "Go"
                    else if (extension === "cs") language = "C#"
                    else if (extension === "cpp" || extension === "cc") language = "C++"
                    else if (extension === "c") language = "C"
                    else if (extension === "html") language = "HTML"
                    else if (extension === "css") language = "CSS"
                    else if (extension === "scss" || extension === "sass") language = "SASS"
                    else if (extension === "jsx") language = "React"
                    else if (extension === "tsx") language = "React/TypeScript"
                    else if (extension === "md") language = "Markdown"
                    else if (extension === "json") language = "JSON"
                    else if (extension === "yml" || extension === "yaml") language = "YAML"

                    languageStats[language] = (languageStats[language] || 0) + 1
                  }
                }
              } catch (detailErr) {
                console.warn("Error fetching commit details:", detailErr)
              }
            }

            return {
              user: contributor.login,
              avatar: contributor.avatar_url,
              languages: languageStats,
            }
          })

          userLanguageStats = await Promise.all(userLanguagePromises)
        } catch (userLangErr) {
          console.warn("Error fetching user language stats:", userLangErr)
        }

        // Initialize userLineStats
        let userLineStats = []
        try {
          // For each contributor, we'll fetch their commits on this branch and analyze lines
          const topContributors = contributors // Process all contributors

          const userLinePromises = topContributors.map(async (contributor: any) => {
            const commitsResponse = await fetch(
              `https://api.github.com/repos/${owner}/${repo}/commits?author=${contributor.login}&sha=${targetBranch}&per_page=100${dateQuery}`,
              { headers },
            )

            if (!commitsResponse.ok) {
              return {
                user: contributor.login,
                avatar: contributor.avatar_url,
                totalAdded: 0,
                totalDeleted: 0,
                netContribution: 0,
                linesByLanguage: {},
              }
            }

            const commits = await commitsResponse.json()

            // Initialize line stats for this user
            const lineStats = {
              user: contributor.login,
              avatar: contributor.avatar_url,
              totalAdded: 0,
              totalDeleted: 0,
              netContribution: 0,
              linesByLanguage: {} as Record<string, { added: number; deleted: number; net: number }>,
            }

            // We'll limit to 10 most recent commits per user to avoid API rate limits
            const recentCommits = commits.slice(0, 10)

            for (const commit of recentCommits) {
              const commitDate = new Date(commit.commit.author.date)

              // Skip if outside date range
              if ((dateRange.from && commitDate < dateRange.from) || (dateRange.to && commitDate > dateRange.to)) {
                continue
              }

              try {
                const commitDetailResponse = await fetch(
                  `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`,
                  { headers },
                )

                if (commitDetailResponse.ok) {
                  const commitDetail = await commitDetailResponse.json()

                  // Process files to count lines
                  for (const file of commitDetail.files || []) {
                    const extension = file.filename.split(".").pop()?.toLowerCase() || "unknown"

                    // Map common extensions to languages (same mapping used elsewhere)
                    let language = extension
                    if (extension === "js") language = "JavaScript"
                    else if (extension === "ts") language = "TypeScript"
                    else if (extension === "py") language = "Python"
                    else if (extension === "java") language = "Java"
                    else if (extension === "rb") language = "Ruby"
                    else if (extension === "go") language = "Go"
                    else if (extension === "php") language = "PHP"
                    else if (extension === "cs") language = "C#"
                    else if (extension === "cpp" || extension === "cc") language = "C++"
                    else if (extension === "c") language = "C"
                    else if (extension === "html") language = "HTML"
                    else if (extension === "css") language = "CSS"
                    else if (extension === "scss" || extension === "sass") language = "SASS"
                    else if (extension === "jsx") language = "React"
                    else if (extension === "tsx") language = "React/TypeScript"
                    else if (extension === "md") language = "Markdown"
                    else if (extension === "json") language = "JSON"
                    else if (extension === "yml" || extension === "yaml") language = "YAML"

                    // Update line counts
                    const additions = file.additions || 0
                    const deletions = file.deletions || 0

                    lineStats.totalAdded += additions
                    lineStats.totalDeleted += deletions
                    lineStats.netContribution = lineStats.totalAdded - lineStats.totalDeleted

                    // Update by language
                    if (!lineStats.linesByLanguage[language]) {
                      lineStats.linesByLanguage[language] = {
                        added: 0,
                        deleted: 0,
                        net: 0,
                      }
                    }

                    lineStats.linesByLanguage[language].added += additions
                    lineStats.linesByLanguage[language].deleted += deletions
                    lineStats.linesByLanguage[language].net =
                      lineStats.linesByLanguage[language].added - lineStats.linesByLanguage[language].deleted
                  }
                }
              } catch (detailErr) {
                console.warn("Error fetching commit details:", detailErr)
              }
            }

            return lineStats
          })

          userLineStats = await Promise.all(userLinePromises)
        } catch (userLineErr) {
          console.warn("Error fetching user line stats:", userLineErr)
        }

        // Sort complexity trend by date
        codeComplexityData.complexityTrend.sort(
          (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        )

        // Calculate average complexity for each language
        Object.keys(codeComplexityData.complexityByLanguage).forEach((lang) => {
          const langData = codeComplexityData.complexityByLanguage[lang]
          langData.averageScore = langData.totalScore / langData.fileCount
        })

        // Process user complexity stats
        if (codeComplexityData.userComplexityStats.size > 0) {
          // Convert map to array and sort by total complexity
          codeComplexityData.userComplexityStats = Array.from(codeComplexityData.userComplexityStats.values()).sort(
            (a, b) => b.totalComplexity - a.totalComplexity,
          )
        }

        // Set code complexity data
        setComplexityData(codeComplexityData)

        // Get branch-specific language data if possible
        let branchLanguages = languages
        try {
          // For branch-specific language data, we can try to get the tree and analyze file extensions
          // This is a rough approximation since GitHub API doesn't provide branch-specific language stats
          const treeResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/${targetBranch}?recursive=1`,
            { headers },
          )

          if (treeResponse.ok) {
            const tree = await treeResponse.json()

            if (tree.tree && Array.isArray(tree.tree)) {
              const languageStats: Record<string, number> = {}

              for (const item of tree.tree) {
                if (item.type === "blob" && item.path) {
                  const extension = item.path.split(".").pop()?.toLowerCase() || "unknown"

                  // Map common extensions to languages
                  let language = extension
                  if (extension === "js") language = "JavaScript"
                  else if (extension === "ts") language = "TypeScript"
                  else if (extension === "py") language = "Python"
                  else if (extension === "java") language = "Java"
                  else if (extension === "rb") language = "Ruby"
                  else if (extension === "go") language = "Go"
                  else if (extension === "cs") language = "C#"
                  else if (extension === "cpp" || extension === "cc") language = "C++"
                  else if (extension === "c") language = "C"
                  else if (extension === "html") language = "HTML"
                  else if (extension === "css") language = "CSS"
                  else if (extension === "scss" || extension === "sass") language = "SASS"
                  else if (extension === "jsx") language = "React"
                  else if (extension === "tsx") language = "React/TypeScript"
                  else if (extension === "md") language = "Markdown"
                  else if (extension === "json") language = "JSON"
                  else if (extension === "yml" || extension === "yaml") language = "YAML"

                  // Use file size as a proxy for byte count
                  languageStats[language] = (languageStats[language] || 0) + (item.size || 1)
                }
              }

              // If we got meaningful data, use it instead of the repository-wide data
              if (Object.keys(languageStats).length > 0) {
                branchLanguages = languageStats
              }
            }
          }
        } catch (branchLangErr) {
          console.warn("Error fetching branch-specific language data:", branchLangErr)
        }

        setRepoData({
          ...repoInfo,
          languages: branchLanguages,
          contributors,
          commitActivity,
          branches,
          userLanguageStats,
          userLineStats,
          currentBranch: targetBranch,
        })

        // Switch to branches tab if this was a branch scan request
        if (branchName && activeTab !== "branches") {
          setActiveTab("branches")
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch repository data")
    } finally {
      setLoading(false)
      setScanProgress(null)
    }
  }

  const handleScanBranch = (branchName: string) => {
    fetchRepoStats(branchName)
  }

  const handleScanAllBranches = () => {
    fetchRepoStats(undefined, true)
  }

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
    // Refetch data with new date range if we already have data
    if (repoData) {
      fetchRepoStats(currentBranch, isAggregateView)
    }
  }

  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">GitHub Repository Statistics</h1>

      <div className="max-w-2xl mx-auto mb-10">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter GitHub repository URL (e.g., https://github.com/vercel/next.js)"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => fetchRepoStats()} disabled={loading}>
              {loading ? "Loading..." : "Analyze"}
            </Button>
          </div>

          <div className="flex gap-2 items-center">
            <Input
              type={showToken ? "text" : "password"}
              placeholder="GitHub token (optional, for private repos)"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowToken(!showToken)}
              title={showToken ? "Hide token" : "Show token"}
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          {token && (
            <p className="text-xs text-muted-foreground">
              Using a GitHub token allows access to private repositories and increases API rate limits. Your token
              should have the 'repo' scope for full repository access.
            </p>
          )}

          {/* <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Date Range:</span>
            </div>
            <DateRangePicker date={dateRange} onChange={handleDateRangeChange} />
          </div> */}
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {scanProgress && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Scanning branches: {scanProgress.current} of {scanProgress.total}
              </span>
              <span>{Math.round((scanProgress.current / scanProgress.total) * 100)}%</span>
            </div>
            <Progress value={(scanProgress.current / scanProgress.total) * 100} />
          </div>
        )}
      </div>

      {repoData && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div>
                  <CardTitle className="text-2xl">{repoData.name}</CardTitle>
                  <CardDescription>{repoData.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {currentBranch && (
                    <Badge
                      variant="outline"
                      className={`self-start sm:self-auto px-3 py-1 text-sm ${isAggregateView ? "bg-primary/10" : ""}`}
                    >
                      {isAggregateView ? (
                        <>
                          <GitMerge className="h-3.5 w-3.5 mr-1.5" />
                          All Branches (Aggregated)
                        </>
                      ) : (
                        <>
                          <GitBranch className="h-3.5 w-3.5 mr-1.5" />
                          Branch: {currentBranch}
                        </>
                      )}
                    </Badge>
                  )}
                  {repoData.branches && repoData.branches.length > 0 && (
                    <BranchSelector
                      branches={repoData.branches}
                      currentBranch={currentBranch}
                      isAggregateView={isAggregateView}
                      onSelectBranch={handleScanBranch}
                      onSelectAllBranches={handleScanAllBranches}
                    />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <Star className="h-6 w-6 mb-2 text-yellow-500" />
                  <span className="text-2xl font-bold">{repoData.stargazers_count.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">Stars</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <GitFork className="h-6 w-6 mb-2 text-blue-500" />
                  <span className="text-2xl font-bold">{repoData.forks_count.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">Forks</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <GitBranch className="h-6 w-6 mb-2 text-green-500" />
                  <span className="text-2xl font-bold">{repoData.open_issues_count.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">Open Issues</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <Users className="h-6 w-6 mb-2 text-purple-500" />
                  <span className="text-2xl font-bold">{repoData.subscribers_count.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">Watchers</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="languages">Languages</TabsTrigger>
              <TabsTrigger value="commits">Commit Activity</TabsTrigger>
              <TabsTrigger value="contributors">Contributors</TabsTrigger>
              <TabsTrigger value="branches">Branches</TabsTrigger>
              <TabsTrigger value="user-languages">User Languages</TabsTrigger>
              <TabsTrigger value="complexity">Code Complexity</TabsTrigger>
              <TabsTrigger value="user-lines">Lines per User</TabsTrigger>
              <TabsTrigger value="language-metrics">Language Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="languages" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Language Distribution</CardTitle>
                  <CardDescription>
                    {isAggregateView
                      ? "Breakdown of programming languages used across all branches"
                      : `Breakdown of programming languages used in this repository${currentBranch ? ` (branch: ${currentBranch})` : ""}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <LanguageChart languages={repoData.languages} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commits" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Commit Activity</CardTitle>
                  <CardDescription>
                    {isAggregateView
                      ? "Weekly commit activity across all branches (de-duplicated)"
                      : `Weekly commit activity${currentBranch ? ` for branch: ${currentBranch}` : ""}`}
                    {dateRange.from &&
                      dateRange.to &&
                      ` from ${format(dateRange.from, "MMM d, yyyy")} to ${format(dateRange.to, "MMM d, yyyy")}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <CommitActivity commitData={repoData.commitActivity} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contributors" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Contributors</CardTitle>
                  <CardDescription>
                    {isAggregateView
                      ? "Most active contributors across all branches"
                      : `Most active contributors${currentBranch ? ` for branch: ${currentBranch}` : ""}`}
                    {dateRange.from &&
                      dateRange.to &&
                      ` from ${format(dateRange.from, "MMM d, yyyy")} to ${format(dateRange.to, "MMM d, yyyy")}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContributorsList contributors={repoData.contributors} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branches" className="mt-4">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Branches</CardTitle>
                    <CardDescription>
                      All branches in this repository
                      {currentBranch && !isAggregateView && ` (currently viewing: ${currentBranch})`}
                      {isAggregateView && " (currently viewing: all branches)"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    className="self-end sm:self-auto"
                    onClick={handleScanAllBranches}
                    disabled={loading || isAggregateView}
                  >
                    <GitMerge className="h-4 w-4 mr-2" />
                    Scan All Branches
                  </Button>
                </CardHeader>
                <CardContent>
                  <BranchList
                    branches={repoData.branches}
                    currentBranch={currentBranch}
                    onScanBranch={handleScanBranch}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="user-languages" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Language Distribution</CardTitle>
                  <CardDescription>
                    {isAggregateView
                      ? "Languages used by top contributors across all branches"
                      : `Languages used by top contributors${currentBranch ? ` for branch: ${currentBranch}` : ""}`}
                    {dateRange.from &&
                      dateRange.to &&
                      ` from ${format(dateRange.from, "MMM d, yyyy")} to ${format(dateRange.to, "MMM d, yyyy")}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserLanguageStats userLanguageStats={repoData.userLanguageStats} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="complexity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Code Complexity Analysis</CardTitle>
                  <CardDescription>
                    Code complexity metrics and lines of code
                    {currentBranch && !isAggregateView && ` for branch: ${currentBranch}`}
                    {isAggregateView && " across all branches"}
                    {dateRange.from &&
                      dateRange.to &&
                      ` from ${format(dateRange.from, "MMM d, yyyy")} to ${format(dateRange.to, "MMM d, yyyy")}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {complexityData ? (
                    <Tabs defaultValue="overview">
                      <TabsList className="mb-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="user-complexity">User Complexity</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview">
                        <CodeComplexity data={complexityData} />
                      </TabsContent>

                      <TabsContent value="user-complexity">
                        {complexityData &&
                          Array.isArray(complexityData.userComplexityStats) &&
                          complexityData.userComplexityStats.length > 0 ? (
                          <UserComplexityStats
                            userComplexityStats={complexityData.userComplexityStats}
                            currentBranch={currentBranch}
                          />
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">
                              No user complexity data available for{" "}
                              {isAggregateView ? "any branch" : `branch: ${currentBranch}`}
                            </p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No code complexity data available for{" "}
                        {isAggregateView ? "any branch" : `branch: ${currentBranch}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="user-lines" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Lines of Code per User</CardTitle>
                  <CardDescription>
                    {isAggregateView
                      ? "Line contributions by top users across all branches"
                      : `Line contributions by top users${currentBranch ? ` for branch: ${currentBranch}` : ""}`}
                    {dateRange.from &&
                      dateRange.to &&
                      ` from ${format(dateRange.from, "MMM d, yyyy")} to ${format(dateRange.to, "MMM d, yyyy")}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserLineStats userLineStats={repoData.userLineStats} currentBranch={currentBranch} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="language-metrics" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Language Metrics</CardTitle>
                  <CardDescription>
                    Detailed analysis of complexity and lines of code per language
                    {currentBranch && !isAggregateView && ` for branch: ${currentBranch}`}
                    {isAggregateView && " across all branches"}
                    {dateRange.from &&
                      dateRange.to &&
                      ` from ${format(dateRange.from, "MMM d, yyyy")} to ${format(dateRange.to, "MMM d, yyyy")}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {complexityData ? (
                    <LanguageMetrics
                      languageMetrics={Object.entries(complexityData.languageLines).map(([language, lines]) => {
                        const langComplexity = complexityData.complexityByLanguage[language] || {
                          totalScore: 0,
                          fileCount: 1,
                          averageScore: 0,
                        }
                        return {
                          language,
                          lines: lines as number,
                          files: langComplexity.fileCount,
                          complexity: langComplexity.totalScore,
                          averageComplexity: langComplexity.averageScore,
                          color: stringToColor(language),
                        }
                      })}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No language metrics data available for{" "}
                        {isAggregateView ? "any branch" : `branch: ${currentBranch}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </main>
  )
}
