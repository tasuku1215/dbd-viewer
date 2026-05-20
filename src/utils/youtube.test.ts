import { describe, it, expect } from 'vitest'
import { extractVideoId } from './youtube'

describe('extractVideoId', () => {
  it('youtu.be 短縮URL', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('youtube.com/watch?v=', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('youtube.com/watch?v= タイムスタンプ付き', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=123s')).toBe('dQw4w9WgXcQ')
  })

  it('youtube.com/embed/', () => {
    expect(extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('youtube.com/shorts/', () => {
    expect(extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('youtube.com/live/', () => {
    expect(extractVideoId('https://www.youtube.com/live/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('無効なURL は null を返す', () => {
    expect(extractVideoId('https://twitch.tv/somestream')).toBeNull()
    expect(extractVideoId('')).toBeNull()
    expect(extractVideoId('not a url')).toBeNull()
  })
})
