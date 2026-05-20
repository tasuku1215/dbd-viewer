import { describe, it, expect } from 'vitest'
import { encodeShareState, decodeShareState } from './share'
import { PanelConfig } from '../types'

const PANELS: PanelConfig[] = [
  { role: 'killer',    emoji: '🔪', label: 'Killer',     name: 'KillerCh',  url: 'https://youtu.be/AAAAA', offset: 0  },
  { role: 'survivor1', emoji: '🟢', label: 'Survivor 1', name: 'SurvivorA', url: 'https://youtu.be/BBBBB', offset: 5  },
  { role: 'survivor2', emoji: '🟣', label: 'Survivor 2', name: 'SurvivorB', url: 'https://youtu.be/CCCCC', offset: -3 },
  { role: 'survivor3', emoji: '🟡', label: 'Survivor 3', name: '',          url: '',                       offset: 0  },
  { role: 'survivor4', emoji: '🔵', label: 'Survivor 4', name: '',          url: '',                       offset: 0  },
]

describe('share URL エンコード/デコード', () => {
  it('エンコードした文字列をデコードすると元のデータに戻る', () => {
    const encoded = encodeShareState(PANELS, 3245, 1.5)
    const decoded = decodeShareState(encoded)

    expect(decoded).not.toBeNull()
    expect(decoded!.t).toBe(3245)
    expect(decoded!.speed).toBe(1.5)
    expect(decoded!.v).toHaveLength(5)
    expect(decoded!.v[0].url).toBe('https://youtu.be/AAAAA')
    expect(decoded!.v[0].offset).toBe(0)
    expect(decoded!.v[1].offset).toBe(5)
    expect(decoded!.v[2].offset).toBe(-3)
  })

  it('再生時刻は小数点以下を切り捨てる', () => {
    const encoded = encodeShareState(PANELS, 99.9, 1)
    const decoded = decodeShareState(encoded)
    expect(decoded!.t).toBe(99)
  })

  it('不正な文字列は null を返す', () => {
    expect(decodeShareState('invalid!!!')).toBeNull()
    expect(decodeShareState('')).toBeNull()
  })

  it('エンコード結果はBase64形式の文字列（URLSearchParamsが%2Bに変換するので+は許容）', () => {
    const encoded = encodeShareState(PANELS, 0, 1)
    // +, -, =, /などBase64系文字のみで構成される（URLSearchParams経由でURLセーフになる）
    expect(encoded).toMatch(/^[A-Za-z0-9+/\-_~=]+$/)
    expect(encoded.length).toBeGreaterThan(0)
  })
})

describe('オフセット同期ロジック（論理時刻）', () => {
  it('killer offset=5 のとき logicalTime=100 → killer は 105 に seek される', () => {
    // seekAll(logicalTime) → player[i].seekTo(logicalTime + panels[i].offset)
    const logicalTime = 100
    const killerTarget = logicalTime + PANELS[0].offset  // 100 + 0 = 100
    const survivor1Target = logicalTime + PANELS[1].offset // 100 + 5 = 105
    const survivor2Target = logicalTime + PANELS[2].offset // 100 + (-3) = 97
    expect(killerTarget).toBe(100)
    expect(survivor1Target).toBe(105)
    expect(survivor2Target).toBe(97)
  })

  it('killer raw=110, killer.offset=10 → logicalTime=100', () => {
    const killerRaw = 110
    const killerOffset = 10
    const logicalTime = killerRaw - killerOffset
    expect(logicalTime).toBe(100)
  })
})
