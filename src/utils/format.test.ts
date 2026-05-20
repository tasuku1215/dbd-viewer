import { describe, it, expect } from 'vitest'
import { formatTime } from './format'

describe('formatTime', () => {
  it('0秒', () => expect(formatTime(0)).toBe('0:00'))
  it('59秒', () => expect(formatTime(59)).toBe('0:59'))
  it('1分', () => expect(formatTime(60)).toBe('1:00'))
  it('1時間', () => expect(formatTime(3600)).toBe('1:00:00'))
  it('1時間23分45秒', () => expect(formatTime(5025)).toBe('1:23:45'))
  it('2時間', () => expect(formatTime(7200)).toBe('2:00:00'))
  it('負の値は 0:00', () => expect(formatTime(-5)).toBe('0:00'))
  it('小数点は切り捨て', () => expect(formatTime(90.9)).toBe('1:30'))
})
