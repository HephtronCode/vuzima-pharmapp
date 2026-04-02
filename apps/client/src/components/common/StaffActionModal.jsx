import { useEffect, useRef } from 'react'
import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion'

function StaffActionModal({
  open,
  mode,
  value,
  onValueChange,
  onCancel,
  onConfirm,
  submitting,
}) {
  const reduceMotion = useReducedMotion()
  const MotionDiv = m.div
  const dialogRef = useRef(null)
  const firstFocusableRef = useRef(null)
  const lastFocusableRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const previousFocus = document.activeElement
    firstFocusableRef.current?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }

      if (event.key !== 'Tab') return
      const first = firstFocusableRef.current
      const last = lastFocusableRef.current
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [open, onCancel])

  if (!open) return null

  const isPasswordMode = mode === 'reset_password'
  const title = isPasswordMode ? 'Reset Temporary Password' : mode === 'disable' ? 'Disable Staff Account' : 'Enable Staff Account'
  const description = isPasswordMode
    ? 'Set a new temporary password (minimum 8 characters) for this staff account.'
    : mode === 'disable'
      ? 'This user will not be able to sign in until re-enabled.'
      : 'Re-enable this account so the staff member can sign in again.'

  return (
    <LazyMotion features={domAnimation}>
      <div className="modal-backdrop" role="presentation" onClick={onCancel}>
        <MotionDiv
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-action-title"
          className="staff-modal"
          ref={dialogRef}
          onClick={(event) => event.stopPropagation()}
          initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <h3 id="staff-action-title">{title}</h3>
          <p>{description}</p>

          {isPasswordMode ? (
            <label className="modal-input-wrap">
              New temporary password
              <input
                type="password"
                placeholder="Minimum 8 characters"
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                ref={firstFocusableRef}
              />
            </label>
          ) : null}

          <div className="modal-actions">
            <button
              type="button"
              className="ghost"
              onClick={onCancel}
              disabled={submitting}
              ref={isPasswordMode ? null : firstFocusableRef}
            >
              Cancel
            </button>
            <button
              type="button"
              className={mode === 'disable' ? 'danger' : ''}
              onClick={onConfirm}
              disabled={submitting}
              ref={lastFocusableRef}
            >
              {submitting ? 'Working...' : (isPasswordMode ? 'Reset Password' : mode === 'disable' ? 'Disable Account' : 'Enable Account')}
            </button>
          </div>
        </MotionDiv>
      </div>
    </LazyMotion>
  )
}

export default StaffActionModal
