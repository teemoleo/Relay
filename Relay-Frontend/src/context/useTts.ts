// This file supports use tts in the Relay handover workflow.
import { useContext } from 'react'
import { TtsContext } from './TtsContext'

// prepares tts so teams can keep baton delivery on track.
export function useTts() {
  const ctx = useContext(TtsContext)
  if (!ctx) throw new Error('useTts must be used within TtsProvider')
  return ctx
}

