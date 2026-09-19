export type OptimalAction = 'ignore' | 'snooze' | 'open'
export type NotificationCategory = 'noise' | 'useful' | 'urgent'
export type Complexity = 'low' | 'normal' | 'high'
export type GamePhase = 'landing' | 'tutorial' | 'playing' | 'paused' | 'result'
export type FailureReason = 'timeout' | 'burnout' | 'incident' | null
export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'

export interface DetailAction { label: string; result: 'correct' | 'neutral' | 'wrong'; closes?: boolean }
export interface GameNotification {
  id: string
  wave: 1 | 2 | 3 | 4
  appearsAt: number
  app: string
  icon: string
  sender?: string
  title: string
  body: string
  category: NotificationCategory
  optimalAction: OptimalAction
  acceptableActions?: OptimalAction[]
  focusCostOnOpen: number
  loadPerSecond: number
  complexity: Complexity
  snoozeSeconds?: number
  expiresAfterSeconds?: number
  consequenceId?: string
  chainId?: string
  chainStep?: number
  detailTitle?: string
  detailBody?: string
  detailActions?: DetailAction[]
  catastrophic?: boolean
}

export interface ActiveNotification extends GameNotification {
  instanceId: string
  appearedAtElapsed: number
  snoozed: boolean
  returnAt?: number
}

export interface PendingConsequence {
  notificationId: string
  dueAt: number
  consequenceId: string
  catastrophic: boolean
  resolved: boolean
}

export interface ResultStats {
  score: number
  grade: Grade
  reportProgress: number
  triageAccuracy: number
  contextSwitches: number
  falseUrgenciesOpened: number
  emergenciesMissed: number
  deepWorkStreak: number
  success: boolean
  failureReason: FailureReason
  achievement: boolean
}

export interface PersistedSettings {
  version: 1
  bestScore: number
  bestGrade: Grade | null
  completedRuns: number
  tutorialSeen: boolean
  soundEnabled: boolean
  reducedEffects: boolean
}
