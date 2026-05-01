// Supports text to speech context for accessibility narration
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

const STORAGE_KEY = 'relay.ttsEnabled'

type TtsContextValue = {
  enabled: boolean
  setEnabled: (value: boolean) => void
  speakMainContent: () => void
}

const TtsContext = createContext<TtsContextValue | null>(null)
export { TtsContext }

// Speaks the given text using speech synthesis
function speakText(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return
  const u = new SpeechSynthesisUtterance(cleaned)
  u.rate = 1
  window.speechSynthesis.speak(u)
}

// Retrieves speakable text from the main content element
function getSpeakableTextFromMain(): string {
  const main = document.querySelector('main')
  if (!main) return ''

  const chunks: string[] = []
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT)

  let node: Node | null = walker.nextNode()
  // Traverses the main content element and collects text nodes that are not hidden or assistive-only
  while (node) {
    const text = (node.textContent ?? '').replace(/\u00a0/g, ' ')
    const trimmed = text.trim()
    // Skips empty text nodes
    if (!trimmed) {
      node = walker.nextNode()
      continue
    }

    const parent = (node as Text).parentElement
    if (!parent || !main.contains(parent)) {
      node = walker.nextNode()
      continue
    }

    if (!isTextNodeSpeakable(parent, main)) {
      node = walker.nextNode()
      continue
    }

    chunks.push(trimmed)
    node = walker.nextNode()
  }

  return chunks.join(' ').replace(/\s+/g, ' ').trim()
}

// Checks if a text node is speakable (not hidden or assistive-only)
function isTextNodeSpeakable(el: Element, boundary: HTMLElement): boolean {
  let cur: Element | null = el
  while (cur && boundary.contains(cur)) {
    // Exclude hidden or assistive-only copy so narration matches visible UI
    if (cur.hasAttribute('data-tts-ignore')) return false
    if (cur.hasAttribute('hidden')) return false

    const tag = cur.tagName
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEMPLATE') return false

    if (cur.classList.contains('sr-only')) return false

    const ariaHidden = cur.getAttribute('aria-hidden')
    if (ariaHidden === 'true') return false

    const style = window.getComputedStyle(cur)
    if (style.display === 'none' || style.visibility === 'hidden') return false
    if (parseFloat(style.opacity) === 0) return false

    if (cur === boundary) break
    cur = cur.parentElement
  }
  return true
}

// Defines TtsProvider component and renders it
export function TtsProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })
  const location = useLocation()

  // Updates enabled state and persists it to localStorage
  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value)
    try {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
    } catch {
      void STORAGE_KEY
    }
    // Cancels speech if disabled and speech synthesis is available
    if (!value && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }, [])

  // Speaks main content when accessibility narration is enabled
  const speakMainContent = useCallback(() => {
    // Read current page content only when accessibility narration is enabled.
    if (!enabled) return
    const text = getSpeakableTextFromMain()
    speakText(text)
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    const t = window.setTimeout(() => speakMainContent(), 400)
    return () => {
      window.clearTimeout(t)
      window.speechSynthesis?.cancel()
    }
  }, [enabled, location.pathname, speakMainContent])

  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
      speakMainContent,
    }),
    [enabled, setEnabled, speakMainContent],
  )

  return <TtsContext.Provider value={value}>{children}</TtsContext.Provider>
}

