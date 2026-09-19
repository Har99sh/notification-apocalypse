import type { ResultStats } from '~/types/game'

export function resultShareText(result: ResultStats): string {
  return `I survived Notification Apocalypse with ${result.grade}: ${result.triageAccuracy}% triage accuracy, ${result.contextSwitches} context switches, and ${result.emergenciesMissed === 0 ? 'zero' : result.emergenciesMissed} missed emergencies. Can you finish the report?`
}

export function useShareResult() {
  const shareStatus = ref('')
  const share = async (result: ResultStats) => {
    const text = resultShareText(result)
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Notification Apocalypse', text })
        shareStatus.value = 'Shared!'
      } else {
        await navigator.clipboard.writeText(text)
        shareStatus.value = 'Result copied!'
      }
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') shareStatus.value = 'Could not share — copy the score above.'
    }
  }
  return { share, shareStatus }
}
