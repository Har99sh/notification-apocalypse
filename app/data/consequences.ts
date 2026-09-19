export interface ConsequenceDefinition {
  id: string
  message: string
  focusLoss: number
  freezeSeconds: number
}

export const consequences: Record<string, ConsequenceDefinition> = {
  missedMeeting: { id: 'missedMeeting', message: 'The meeting started without you. Awkward.', focusLoss: 8, freezeSeconds: 2 },
  securityBreach: { id: 'securityBreach', message: 'Unknown login became a very known problem.', focusLoss: 18, freezeSeconds: 5 },
  bugEscalation: { id: 'bugEscalation', message: 'The high-priority bug found a customer.', focusLoss: 12, freezeSeconds: 3 },
  mfaExpired: { id: 'mfaExpired', message: 'MFA expired. Your deployment session signed out.', focusLoss: 10, freezeSeconds: 4 },
  exportStalled: { id: 'exportStalled', message: 'The stuck export generated three support tickets.', focusLoss: 14, freezeSeconds: 4 },
  batteryShutdown: { id: 'batteryShutdown', message: 'Battery critically low. Autosave is sweating.', focusLoss: 15, freezeSeconds: 6 },
  checkoutIncident: { id: 'checkoutIncident', message: 'Checkout errors are still climbing.', focusLoss: 12, freezeSeconds: 4 },
  rollbackFailure: { id: 'rollbackFailure', message: 'Rollback missed. Checkout is down.', focusLoss: 100, freezeSeconds: 0 },
}
