import type { AppState } from '../types'

export const STORAGE_KEY = 'plan2meses:v1'

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AppState
  } catch {
    return null
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage lleno o bloqueado — ignorar silenciosamente
  }
}

export function exportJSON(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `operacion-bikini-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importJSON(): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return reject(new Error('Sin archivo'))
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const state = JSON.parse(e.target?.result as string) as AppState
          resolve(state)
        } catch {
          reject(new Error('JSON inválido'))
        }
      }
      reader.readAsText(file)
    }
    input.click()
  })
}
