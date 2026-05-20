const PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  /youtube\.com\/shorts\/([^&\n?#]+)/,
  /youtube\.com\/live\/([^&\n?#]+)/,
]

export function extractVideoId(url: string): string | null {
  for (const re of PATTERNS) {
    const m = url.match(re)
    if (m) return m[1]
  }
  return null
}
