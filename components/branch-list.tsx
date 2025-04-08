"use client"

import { GitBranch, GitCommit, GitMerge, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Branch {
  name: string
  commit: {
    sha: string
    url: string
  }
  protected: boolean
}

interface BranchListProps {
  branches: Branch[]
  currentBranch: string
  onScanBranch: (branchName: string) => void
}

export function BranchList({ branches, currentBranch, onScanBranch }: BranchListProps) {
  // Sort branches - put default branch (usually main or master) first, then current branch, then others
  const sortedBranches = [...(branches || [])].sort((a, b) => {
    if (a.name === currentBranch && b.name !== "main" && b.name !== "master") return -1
    if (b.name === currentBranch && a.name !== "main" && a.name !== "master") return 1
    if (a.name === "main" || a.name === "master") return -1
    if (b.name === "main" || b.name === "master") return 1
    return a.name.localeCompare(b.name)
  })

  if (!branches || branches.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No branch data available</p>
      </div>
    )
  }

  // Check if we're in aggregate view
  const isAggregateView = currentBranch === "all-branches"

  return (
    <div className="space-y-4">
      {isAggregateView && (
        <Card className="overflow-hidden bg-primary/5 border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GitMerge className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">All Branches (Aggregated)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Showing combined statistics across all branches
                  </div>
                </div>
              </div>
              <Badge variant="secondary">Current View</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {sortedBranches.map((branch) => (
        <Card
          key={branch.name}
          className={`overflow-hidden ${branch.name === currentBranch ? "border-primary bg-primary/5" : ""}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GitBranch
                  className={`h-5 w-5 ${branch.name === currentBranch ? "text-primary" : "text-muted-foreground"}`}
                />
                <div>
                  <div className="font-medium">{branch.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <GitCommit className="h-3 w-3" />
                    <span className="font-mono">{branch.commit.sha.substring(0, 7)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {branch.protected && (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                    Protected
                  </Badge>
                )}
                {(branch.name === "main" || branch.name === "master") && (
                  <Badge variant="default" className="bg-primary">
                    Default
                  </Badge>
                )}
                {branch.name === currentBranch && !isAggregateView ? (
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    Current
                  </Badge>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8" onClick={() => onScanBranch(branch.name)}>
                          <Search className="h-3.5 w-3.5 mr-1" />
                          Scan
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Analyze this branch specifically</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
