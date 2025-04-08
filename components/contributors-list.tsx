"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

interface Contributor {
  login: string
  avatar_url: string
  html_url: string
  contributions: number
}

interface ContributorsListProps {
  contributors: Contributor[]
}

export function ContributorsList({ contributors }: ContributorsListProps) {
  // Sort contributors by number of contributions
  const sortedContributors = [...contributors].sort((a, b) => b.contributions - a.contributions)

  // Get the maximum number of contributions for scaling
  const maxContributions = sortedContributors[0]?.contributions || 1

  return (
    <div className="space-y-4">
      {sortedContributors.length > 0 ? (
        sortedContributors.map((contributor) => (
          <div key={contributor.login} className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={contributor.avatar_url} alt={contributor.login} />
              <AvatarFallback>{contributor.login.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <a
                  href={contributor.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline"
                >
                  {contributor.login}
                </a>
                <span className="text-sm text-muted-foreground">
                  {contributor.contributions.toLocaleString()} commits
                </span>
              </div>
              <Progress value={(contributor.contributions / maxContributions) * 100} className="h-2" />
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No contributor data available</p>
        </div>
      )}
    </div>
  )
}
