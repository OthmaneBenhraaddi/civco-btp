/**
 * Wizard helpers — avoid <form onSubmit> for multi-step flows.
 *
 * Pressing Enter in an input triggers implicit form submission. If the handler
 * advances the step synchronously, the browser can still activate a newly
 * rendered type="submit" button in the same event and create the record early.
 */

export function handleWizardEnterKey(event, {
  step,
  totalSteps,
  canAdvance,
  goNext,
  onFinalSubmit,
}) {
  if (event.key !== 'Enter') {
    return
  }

  if (event.target.tagName === 'TEXTAREA') {
    return
  }

  if (event.nativeEvent?.isComposing) {
    return
  }

  event.preventDefault()

  if (step < totalSteps - 1) {
    if (canAdvance()) {
      goNext()
    }
    return
  }

  onFinalSubmit()
}
