import LZString from 'lz-string'
import { ShareData, PanelConfig, Role } from '../types'

export function encodeShareState(panels: PanelConfig[], currentTime: number, speed: number): string {
  const data: ShareData = {
    v: panels.map((p) => ({ role: p.role, name: p.name, url: p.url, offset: p.offset })),
    t: Math.floor(currentTime),
    speed,
  }
  return LZString.compressToEncodedURIComponent(JSON.stringify(data))
}

export function decodeShareState(encoded: string): ShareData | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    return JSON.parse(json) as ShareData
  } catch {
    return null
  }
}

export function buildShareUrl(panels: PanelConfig[], currentTime: number, speed: number): string {
  const s = encodeShareState(panels, currentTime, speed)
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set('s', s)
  return url.toString()
}

export function parseShareUrl(): ShareData | null {
  const params = new URLSearchParams(window.location.search)
  const s = params.get('s')
  if (!s) return null
  return decodeShareState(s)
}

const ROLE_ORDER: Role[] = ['killer', 'survivor1', 'survivor2', 'survivor3', 'survivor4']
const EMOJIS: Record<Role, string> = {
  killer: '🔪', survivor1: '🟢', survivor2: '🟣', survivor3: '🟡', survivor4: '🔵',
}
const LABELS: Record<Role, string> = {
  killer: 'Killer', survivor1: 'Survivor 1', survivor2: 'Survivor 2',
  survivor3: 'Survivor 3', survivor4: 'Survivor 4',
}

export function shareDataToPanels(data: ShareData): PanelConfig[] {
  return ROLE_ORDER.map((role) => {
    const found = data.v.find((v) => v.role === role)
    return {
      role,
      emoji: EMOJIS[role],
      label: LABELS[role],
      name: found?.name ?? '',
      url: found?.url ?? '',
      offset: found?.offset ?? 0,
    }
  })
}
