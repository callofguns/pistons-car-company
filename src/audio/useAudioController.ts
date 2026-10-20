import { useEffect } from 'react'
import { useGameStore } from '../store/useGameStore'
import { useAudioStore } from '../store/useAudioStore'
import type { NewsEventType } from '../core/news'
import type { World } from '../core/world'
import { playSfx, setTabVisible, unlockAudio } from './engine'

const NEWS_SOUNDS: Partial<Record<NewsEventType, Parameters<typeof playSfx>[0]>> = {
  ModelReleased: 'fanfare',
  ResearchCompleted: 'chime',
  HQUpgraded: 'fanfare',
  AchievementUnlocked: 'fanfare',
  LoanTaken: 'cash',
  BankruptcyWarning: 'warning',
  HistoryEventStarted: 'warning',
  ModelSoldOut: 'error',
  RaceCompleted: 'chime',
}

/** Wires the sound up once, at the app root: unlocks audio on the first tap, clicks on every
 * enabled button, sounds for sales and news, and pauses the music in a hidden tab. */
export function useAudioController(): void {
  useEffect(() => {
    // Touching the store also applies the saved music/effects settings to the engine.
    useAudioStore.getState()

    const onPointerDown = () => {
      unlockAudio()
    }
    const onClick = (event: MouseEvent) => {
      const button = (event.target as Element | null)?.closest?.('button')
      if (button && !button.disabled) playSfx('click')
    }
    const onVisibility = () => setTabVisible(!document.hidden)
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('click', onClick, true)
    document.addEventListener('visibilitychange', onVisibility)

    let watchedWorld: World | null = null
    let lastNewsId: string | null = null
    let lastSold = 0
    const unsubscribe = useGameStore.subscribe((state) => {
      const world = state.world
      const newestNews = world.news.entries[0]
      // A different world object means a game was loaded or started: just re-sync, no sounds.
      if (world !== watchedWorld) {
        watchedWorld = world
        lastNewsId = newestNews?.id ?? null
        lastSold = world.company.totalCarsSoldAllModels
        return
      }
      if (newestNews && newestNews.id !== lastNewsId) {
        const entries = world.news.entries
        const knownIndex = entries.findIndex((e) => e.id === lastNewsId)
        const fresh = knownIndex === -1 ? entries : entries.slice(0, knownIndex)
        const sound = fresh.map((e) => NEWS_SOUNDS[e.type]).find((s) => s !== undefined)
        if (sound) playSfx(sound)
        lastNewsId = newestNews.id
      }
      const sold = world.company.totalCarsSoldAllModels
      if (sold > lastSold) playSfx('cash')
      lastSold = sold
    })

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('visibilitychange', onVisibility)
      unsubscribe()
    }
  }, [])
}
