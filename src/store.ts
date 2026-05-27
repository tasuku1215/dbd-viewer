import { create } from 'zustand'
import { PanelConfig, Layout, Memo, VideoQuality } from './types'

const DEFAULT_PANELS: PanelConfig[] = [
  { role: 'killer',    emoji: '🔪', label: 'Killer',      name: '', url: '', offset: 0 },
  { role: 'survivor1', emoji: '🟢', label: 'Survivor 1',  name: '', url: '', offset: 0 },
  { role: 'survivor2', emoji: '🟣', label: 'Survivor 2',  name: '', url: '', offset: 0 },
  { role: 'survivor3', emoji: '🟡', label: 'Survivor 3',  name: '', url: '', offset: 0 },
  { role: 'survivor4', emoji: '🔵', label: 'Survivor 4',  name: '', url: '', offset: 0 },
]

// Default: killer audible, survivors muted
const DEFAULT_VOLUMES = [100, 0, 0, 0, 0]

interface AppStore {
  panels: PanelConfig[]
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackRate: number
  layout: Layout
  focusedPanel: number
  expandedPanel: number | null
  quality: VideoQuality
  volumes: number[]           // M4: controlled volume state per panel
  memos: Memo[]
  showShareModal: boolean
  isSetup: boolean
  initialTime: number

  setPanels: (panels: PanelConfig[]) => void
  updatePanel: (index: number, patch: Partial<PanelConfig>) => void
  setIsPlaying: (v: boolean) => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  setPlaybackRate: (r: number) => void
  setLayout: (l: Layout) => void
  setFocusedPanel: (i: number) => void
  setExpandedPanel: (i: number | null) => void
  setQuality: (q: VideoQuality) => void
  setVolume: (index: number, volume: number) => void
  addMemo: (time: number) => void
  removeMemo: (id: string) => void
  setShowShareModal: (v: boolean) => void
  setIsSetup: (v: boolean) => void
  setInitialTime: (t: number) => void
}

export const useStore = create<AppStore>((set) => ({
  panels: DEFAULT_PANELS,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  layout: 'default',
  focusedPanel: 0,
  expandedPanel: null,
  quality: 'default',        // L1: default = auto (setPlaybackQuality is deprecated anyway)
  volumes: DEFAULT_VOLUMES,
  memos: [],
  showShareModal: false,
  isSetup: true,
  initialTime: 0,

  setPanels: (panels) => set({ panels }),
  updatePanel: (index, patch) =>
    set((state) => {
      const panels = [...state.panels]
      panels[index] = { ...panels[index], ...patch }
      return { panels }
    }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setLayout: (layout) => set({ layout }),
  setFocusedPanel: (focusedPanel) => set({ focusedPanel }),
  setExpandedPanel: (expandedPanel) => set({ expandedPanel }),
  setQuality: (quality) => set({ quality }),
  setVolume: (index, volume) =>
    set((s) => {
      const volumes = [...s.volumes]
      volumes[index] = volume
      return { volumes }
    }),
  // M6: use crypto.randomUUID() to avoid duplicate IDs on rapid calls
  addMemo: (time) => set((s) => ({
    memos: [...s.memos, { id: crypto.randomUUID(), time: Math.floor(time) }],
  })),
  removeMemo: (id) => set((s) => ({ memos: s.memos.filter((m) => m.id !== id) })),
  setShowShareModal: (showShareModal) => set({ showShareModal }),
  setIsSetup: (isSetup) => set({ isSetup }),
  setInitialTime: (initialTime) => set({ initialTime }),
}))
