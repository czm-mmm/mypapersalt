import selectUrl from '../assets/audio/select.wav?url'
import playUrl from '../assets/audio/play.wav?url'

type SoundName = 'select' | 'play'

const urls: Record<SoundName, string> = { select: selectUrl, play: playUrl }
const pool = new Map<SoundName, HTMLAudioElement[]>()
let enabled = localStorage.getItem('origami-sound') !== 'off'
let unlocked = false

function makeAudio(name: SoundName): HTMLAudioElement {
  const audio = new Audio(urls[name])
  audio.preload = 'auto'
  audio.volume = name === 'select' ? 0.24 : 0.3
  return audio
}

export function soundEnabled(): boolean { return enabled }

export function setSoundEnabled(value: boolean): void {
  enabled = value
  localStorage.setItem('origami-sound', value ? 'on' : 'off')
  if (value) playSound('select')
}

export function unlockAudio(): void {
  if (unlocked) return
  unlocked = true
  for (const name of Object.keys(urls) as SoundName[]) pool.set(name, [makeAudio(name), makeAudio(name)])
}

export function playSound(name: SoundName): void {
  if (!enabled || document.hidden) return
  unlockAudio()
  const audios = pool.get(name) ?? [makeAudio(name)]
  const audio = audios.find((item) => item.paused) ?? audios[0]
  audio.currentTime = 0
  void audio.play().catch(() => undefined)
}

