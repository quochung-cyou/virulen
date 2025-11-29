export function withBasePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`

  // Avoid double-prefixing if the path already includes the basePath
  if (normalized.startsWith("/virulen/")) return normalized

  if (typeof window === "undefined") {
    // On the server we can't inspect location, but using the un-prefixed
    // path still works for dev and most static export scenarios.
    return normalized
  }

  const isOnGithubBasePath = window.location.pathname.startsWith("/virulen")
  return isOnGithubBasePath ? `/virulen${normalized}` : normalized
}
