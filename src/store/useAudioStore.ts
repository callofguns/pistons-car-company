import { create } from 'zustand'
import { setMusicEnabled, setSfxEnabled } from '../audio/engine'

const STORAGE_KEY = 'pistons.audio.v1'

interface AudioSettings {
  musicOn: boolean
  sfxOn: boolean
}

function load(): AudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AudioSettings>
      return { musicOn: parsed.musicOn !== false, sfxOn: parsed.sfxOn !== false }
    }
  } catch {
    // Storage blocked or corrupt: use the defaults.
  }
  return { musicOn: true, sfxOn: true }
}

interface AudioStore extends AudioSettings {
  setMusic: (on: boolean) => void
  setSfx: (on: boolean) => void
  /** The speaker button: everything on, or everything off. */
  toggleAll: () => void
}

function save(settings: AudioSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Not being able to remember the setting is fine.
  }
}

export const useAudioStore = create<AudioStore>((set, get) => {
  const initial = load()
  setMusicEnabled(initial.musicOn)
  setSfxEnabled(initial.sfxOn)
  return {
    ...initial,
    setMusic: (on) => {
      setMusicEnabled(on)
      set({ musicOn: on })
      save({ musicOn: on, sfxOn: get().sfxOn })
    },
    setSfx: (on) => {
      setSfxEnabled(on)
      set({ sfxOn: on })
      save({ musicOn: get().musicOn, sfxOn: on })
    },
    toggleAll: () => {
      const anyOn = get().musicOn || get().sfxOn
      get().setMusic(!anyOn)
      get().setSfx(!anyOn)
    },
  }
})
