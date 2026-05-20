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

    callbacks.push(() => setReady(true))

    if (apiState === 'idle') {
      apiState = 'loading'
      window.onYouTubeIframeAPIReady = () => {
        apiState = 'ready'
        callbacks.forEach((cb) => cb())
        callbacks.length = 0
      }
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
    }
  }, [])

  return ready
}
