import { create } from 'zustand'
import { PanelConfig, Layout, Memo } from './types'

const DEFAULT_PANELS: PanelConfig[] = [
  { role: 'killer',    emoji: '🔪', label: 'Killer',      name: '', url: '', offset: 0 },
  { role: 'survivor1', emoji: '🟢', label: 'Survivor 1',  name: '', url: '', offset: 0 },
  { role: 'survivor2', emoji: '🟣', label: 'Survivor 2',  name: '', url: '', offset: 0 },
  { role: 'survivor3', emoji: '🟡', label: 'Survivor 3',  name: '', url: '', offset: 0 },
  { role: 'survivor4', emoji: '🔵', label: 'Survivor 4',  name: '', url: '', offset: 0 },
]

interface AppStore {
  panels: PanelConfig[]
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackRate: number
  layout: Layout
  focusedPanel: number       // 0 = killer, 1-4 = survivors
  expandedPanel: number | null
  quality: string
  memos: Memo[]
  showShareModal: boolean
  isSetup: boolean           // true = URL input screen
  initialTime: number        // time to seek to on load (from share URL)

  setPanels: (panels: PanelConfig[]) => void
  updatePanel: (index: number, patch: Partial<PanelConfig>) => void
  setIsPlaying: (v: boolean) => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  setPlaybackRate: (r: number) => void
  setLayout: (l: Layout) => void
  setFocusedPanel: (i: number) => void
  setExpandedPanel: (i: number | null) => void
  setQuality: (q: string) => void
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
  quality: 'hd720',
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
  addMemo: (time) => set((s) => ({
    memos: [...s.memos, { id: `${Date.now()}`, time: Math.floor(time) }],
  })),
  removeMemo: (id) => set((s) => ({ memos: s.memos.filter((m) => m.id !== id) })),
  setShowShareModal: (showShareModal) => set({ showShareModal }),
  setIsSetup: (isSetup) => set({ isSetup }),
  setInitialTime: (initialTime) => set({ initialTime }),
}))
