/**
 * All sound is made here with the browser's Web Audio API - no audio files, so the game stays
 * tiny and works offline. Effects are short synthesized blips; the music is a quiet generated
 * loop (soft chords, a bass note and a slow arpeggio).
 *
 * Browsers only allow sound after the player has tapped something, so the AudioContext is created
 * lazily by unlockAudio() on the first tap.
 */

type Sfx = 'click' | 'cash' | 'error' | 'chime' | 'fanfare' | 'warning' | 'build'

let ctx: AudioContext | null = null
let musicGain: GainNode | null = null
let sfxGain: GainNode | null = null
let musicWanted = false
let sfxWanted = true
let musicTimer: ReturnType<typeof setInterval> | null = null
let nextBarTime = 0
let barIndex = 0

const MUSIC_VOLUME = 0.22
const SFX_VOLUME = 0.5
const BPM = 84
const BAR_SECONDS = (60 / BPM) * 4

function audioContextClass(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') return undefined
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
}

/** Call from a user tap. Creates the audio context the first time and resumes it after that. */
export function unlockAudio(): void {
  const Ctor = audioContextClass()
  if (!Ctor) return
  if (!ctx) {
    try {
      ctx = new Ctor()
    } catch {
      return
    }
    musicGain = ctx.createGain()
    musicGain.gain.value = musicWanted ? MUSIC_VOLUME : 0
    musicGain.connect(ctx.destination)
    sfxGain = ctx.createGain()
    sfxGain.gain.value = sfxWanted ? SFX_VOLUME : 0
    sfxGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  if (musicWanted) startMusicLoop()
}

export function setMusicEnabled(on: boolean): void {
  musicWanted = on
  if (musicGain && ctx) musicGain.gain.setTargetAtTime(on ? MUSIC_VOLUME : 0, ctx.currentTime, 0.2)
  if (on) startMusicLoop()
  else stopMusicLoop()
}

export function setSfxEnabled(on: boolean): void {
  sfxWanted = on
  if (sfxGain && ctx) sfxGain.gain.setTargetAtTime(on ? SFX_VOLUME : 0, ctx.currentTime, 0.02)
}

/** Stops the music while the tab is hidden (and restarts it when it returns). */
export function setTabVisible(visible: boolean): void {
  if (!ctx) return
  if (visible) {
    void ctx.resume()
    if (musicWanted) startMusicLoop()
  } else {
    stopMusicLoop()
    void ctx.suspend()
  }
}

function tone(freq: number, start: number, duration: number, opts: { type?: OscillatorType; volume?: number; slideTo?: number; attack?: number; dest?: AudioNode } = {}): void {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(freq, start)
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, start + duration)
  const peak = opts.volume ?? 0.3
  const attack = opts.attack ?? 0.005
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(peak, start + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain)
  gain.connect(opts.dest ?? sfxGain ?? ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

let lastPlayed: Partial<Record<Sfx, number>> = {}
/** Minimum seconds between the same effect, so fast-forward doesn't machine-gun it. */
const COOLDOWN: Partial<Record<Sfx, number>> = { click: 0.03, cash: 0.6, build: 1.5 }

export function playSfx(name: Sfx): void {
  if (!ctx || !sfxWanted || ctx.state !== 'running') return
  const t = ctx.currentTime
  if (t - (lastPlayed[name] ?? -10) < (COOLDOWN[name] ?? 0.05)) return
  lastPlayed[name] = t
  switch (name) {
    case 'click':
      tone(520, t, 0.06, { type: 'triangle', volume: 0.25, slideTo: 380 })
      break
    case 'cash':
      tone(1318, t, 0.09, { type: 'square', volume: 0.1 })
      tone(1760, t + 0.07, 0.22, { type: 'square', volume: 0.1 })
      break
    case 'error':
      tone(180, t, 0.18, { type: 'sawtooth', volume: 0.18, slideTo: 120 })
      break
    case 'chime':
      tone(784, t, 0.35, { volume: 0.25 })
      tone(1175, t + 0.12, 0.5, { volume: 0.22 })
      break
    case 'fanfare':
      ;[523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.1, 0.4, { type: 'triangle', volume: 0.25 }))
      break
    case 'warning':
      tone(330, t, 0.2, { type: 'square', volume: 0.15 })
      tone(262, t + 0.22, 0.3, { type: 'square', volume: 0.15 })
      break
    case 'build':
      tone(140, t, 0.12, { type: 'square', volume: 0.12, slideTo: 90 })
      break
  }
}

// ---- Music -------------------------------------------------------------------------------------

const NOTE = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

/** A relaxed four-chord loop (C - Am - F - G), as MIDI notes: [bass, ...chord]. */
const PROGRESSION: number[][] = [
  [36, 60, 64, 67],
  [33, 57, 60, 64],
  [41, 57, 60, 65],
  [31, 59, 62, 67],
]

function scheduleBar(start: number): void {
  if (!ctx || !musicGain) return
  const [bass, ...chord] = PROGRESSION[barIndex % PROGRESSION.length]
  const beat = BAR_SECONDS / 4
  // Soft pad: the whole chord held for the bar.
  for (const note of chord) tone(NOTE(note - 12), start, BAR_SECONDS * 0.95, { type: 'sine', volume: 0.07, attack: 0.5, dest: musicGain })
  // Bass on beats 1 and 3.
  tone(NOTE(bass), start, beat * 1.6, { type: 'triangle', volume: 0.16, dest: musicGain })
  tone(NOTE(bass), start + beat * 2, beat * 1.6, { type: 'triangle', volume: 0.12, dest: musicGain })
  // A gentle arpeggio of eighth notes, with one note left out now and then.
  const pattern = [0, 1, 2, 1, 0, 2, 1, 2]
  pattern.forEach((p, i) => {
    if ((barIndex + i) % 5 === 4) return
    tone(NOTE(chord[p] + 12), start + (i * beat) / 2, beat * 0.9, { type: 'sine', volume: 0.08, dest: musicGain! })
  })
  barIndex += 1
}

function startMusicLoop(): void {
  if (!ctx || musicTimer !== null) return
  nextBarTime = ctx.currentTime + 0.1
  musicTimer = setInterval(() => {
    if (!ctx || ctx.state !== 'running') return
    // Keep about two bars scheduled ahead.
    while (nextBarTime < ctx.currentTime + BAR_SECONDS * 2) {
      scheduleBar(nextBarTime)
      nextBarTime += BAR_SECONDS
    }
  }, 500)
}

function stopMusicLoop(): void {
  if (musicTimer !== null) clearInterval(musicTimer)
  musicTimer = null
}
