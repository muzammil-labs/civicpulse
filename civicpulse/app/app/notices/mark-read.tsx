'use client'

import { useEffect } from 'react'
import { markNoticesRead } from '../actions'

export function MarkRead({ ids }: { ids: string[] }) {
  const key = ids.join(',')
  useEffect(() => {
    if (key) void markNoticesRead(key.split(','))
  }, [key])
  return null
}
