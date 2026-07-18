export function nextSlide(index: number, count: number): number {
  return Math.min(Math.max(0, count - 1), index + 1)
}

export function previousSlide(index: number, count: number): number {
  return Math.max(0, Math.min(index - 1, count - 1))
}

export function isInteractiveNavigationTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as { closest?: unknown }).closest !== 'function') return false
  return Boolean((target as unknown as { closest: (selector: string) => unknown }).closest(
    'a,button,input,textarea,select,video,iframe,[contenteditable="true"]',
  ))
}
