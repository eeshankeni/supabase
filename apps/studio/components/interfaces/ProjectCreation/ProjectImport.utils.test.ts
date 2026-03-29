import { describe, expect, it } from 'vitest'

import { isSupabaseSourceUrl } from './ProjectImport.utils'

describe('isSupabaseSourceUrl', () => {
  it('accepts hosted Supabase project URLs', () => {
    expect(isSupabaseSourceUrl('https://abcd1234.supabase.co')).toBe(true)
  })

  it('rejects non-https URLs', () => {
    expect(isSupabaseSourceUrl('http://abcd1234.supabase.co')).toBe(false)
  })

  it('rejects non-Supabase hosts', () => {
    expect(isSupabaseSourceUrl('https://example.com')).toBe(false)
  })

  it('rejects malformed input', () => {
    expect(isSupabaseSourceUrl('not-a-url')).toBe(false)
  })
})
