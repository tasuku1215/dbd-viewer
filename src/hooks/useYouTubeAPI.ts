import { useEffect, useState } from 'react'

let apiState: 'idle' | 'loading' | 'ready' = 'idle'
const callbacks: Array<() => void> = []

export function useYouTubeAPI(): boolean {
  const [ready, setReady] = useState(apiState === 'ready')

  useEffect(() => {
    if (apiState === 'ready') {
      setReady(true)
      return
    }

    // Fix: keep reference to this component's callback so we can remove it on unmount
    // This prevents stale setReady calls accumulating across HMR reloads (Medium fix)
    const cb = () => setReady(true)
    callbacks.push(cb)

    if (apiState === 'idle') {
      apiState = 'loading'
      window.onYouTubeIframeAPIReady = () => {
        apiState = 'ready'
        callbacks.forEach((fn) => fn())
        callbacks.length = 0
      }
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
    }

    return () => {
      // Remove this component's callback on unmount to prevent stale calls
      const i = callbacks.indexOf(cb)
      if (i !== -1) callbacks.splice(i, 1)
    }
  }, [])

  return ready
}
