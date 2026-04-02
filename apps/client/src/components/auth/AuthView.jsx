import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion'

function AuthView({ loginForm, setLoginForm, loginErrors, loginSubmitting, onSubmit, toast }) {
  const reduceMotion = useReducedMotion()
  const MotionForm = m.form
  const MotionH1 = m.h1
  const MotionP = m.p
  const MotionLabel = m.label
  const MotionButton = m.button
  const MotionDiv = m.div
  const cardTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }

  const itemTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }

  return (
    <LazyMotion features={domAnimation}>
      <div className="auth-shell">
        <MotionForm
          className="auth-card"
          onSubmit={onSubmit}
          initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.995 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={cardTransition}
        >
          <MotionH1 initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={itemTransition}>Vuzima Pharma Go</MotionH1>
          <MotionP initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={itemTransition}>Sign in to continue.</MotionP>

          <MotionLabel initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={itemTransition}>
            Email
            <input
              type="email"
              value={loginForm.email}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            {loginErrors.email ? <span className="field-error">{loginErrors.email}</span> : null}
          </MotionLabel>

          <MotionLabel initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={itemTransition}>
            Password
            <input
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
            {loginErrors.password ? <span className="field-error">{loginErrors.password}</span> : null}
          </MotionLabel>

          <MotionButton type="submit" disabled={loginSubmitting} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={itemTransition}>
            {loginSubmitting ? 'Signing in...' : 'Sign In'}
          </MotionButton>

          <MotionDiv className="hint" initial={reduceMotion ? false : { opacity: 0 }} animate={reduceMotion ? undefined : { opacity: 1 }} transition={itemTransition}>
            <div>Admin: admin@vuzimapharmago.app / AdminPass123!</div>
            <div>Staff: staff@vuzimapharmago.app / StaffPass123!</div>
          </MotionDiv>

          <MotionDiv className="quote-grid" initial={reduceMotion ? false : { opacity: 0 }} animate={reduceMotion ? undefined : { opacity: 1 }} transition={itemTransition}>
            <blockquote>
              "Healthy teams build healthy communities. Every accurate stock update saves a life somewhere."
            </blockquote>
            <blockquote>
              "Small small, we go reach top together."
            </blockquote>
          </MotionDiv>
        </MotionForm>

        {toast ? (
          <MotionDiv
            className={`toast ${toast.kind}`}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={itemTransition}
          >
            {toast.text}
          </MotionDiv>
        ) : null}
      </div>
    </LazyMotion>
  )
}

export default AuthView
