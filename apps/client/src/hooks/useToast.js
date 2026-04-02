import { useEffect, useState } from 'react'

export function useToast() {
  const [toast, setToast] = useState(null)

  function showToast(kind, text) {
    setToast({ kind, text })
  }

  useEffect(() => {
    if (!toast) return undefined
    const handle = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(handle)
  }, [toast])

  return { toast, showToast }
}
