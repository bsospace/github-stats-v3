"use client"

import { GitBranch, GitMerge } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface Branch {
  name: string
  commit: {
    sha: string
  }
  protected: boolean
}

interface BranchSelectorProps {
  branches: Branch[]
  currentBranch: string
  isAggregateView: boolean
  onSelectBranch: (branchName: string) => void
  onSelectAllBranches: () => void
}

export function BranchSelector({
  branches,
  currentBranch,
  isAggregateView,
  onSelectBranch,
  onSelectAllBranches,
}: BranchSelectorProps) {
  // Sort branches - put default branch (usually main or master) first, then current branch, then others
  const sortedBranches = [...(branches || [])].sort((a, b) => {
    if (a.name === "main" || a.name === "master") return -1
    if (b.name === "main" || b.name === "master") return 1
    return a.name.localeCompare(b.name)
  })

  if (!branches || branches.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {isAggregateView ? (
            <>
              <GitMerge className="h-4 w-4" />
              <span>All Branches</span>
            </>
          ) : (
            <>
              <GitBranch className="h-4 w-4" />
              <span>{currentBranch}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Branch</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center justify-between" onClick={onSelectAllBranches}>
          <div className="flex items-center gap-2">
            <GitMerge className="h-4 w-4" />
            <span>All Branches</span>
          </div>
          {isAggregateView && <Badge variant="secondary">Current</Badge>}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {sortedBranches.map((branch) => (
          <DropdownMenuItem
            key={branch.name}
            className="flex items-center justify-between"
            onClick={() => onSelectBranch(branch.name)}
          >
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              <span>{branch.name}</span>
              {(branch.name === "main" || branch.name === "master") && (
                <Badge variant="outline" className="ml-1 text-xs py-0">
                  default
                </Badge>
              )}
            </div>
            {branch.name === currentBranch && !isAggregateView && <Badge variant="secondary">Current</Badge>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
