'use client'

import { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

export const SendCredentialsButton = () => {
  const docInfo = useDocumentInfo()
  const id = docInfo?.id
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSend = async () => {
    if (!id) {
      setErrorMsg('Najpierw zapisz klienta')
      setStatus('error')
      return
    }

    const password = window.prompt(
      'Wklej haslo klienta (ze schowka po kliknieciu "Generuj haslo").\n\nHasla nie mozna odczytac po zapisaniu - musisz je wkleic recznie:',
    )

    if (!password) return

    setStatus('sending')
    setErrorMsg('')

    try {
      const res = await fetch('/api/clients/send-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: id, password }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('sent')
        setTimeout(() => setStatus('idle'), 5000)
      } else {
        setErrorMsg(data.error || 'Blad wysylania')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Blad polaczenia z serwerem')
      setStatus('error')
    }
  }

  const buttonStyles: Record<string, React.CSSProperties> = {
    idle: { background: '#826D4C' },
    sending: { background: '#999', cursor: 'not-allowed' },
    sent: { background: '#22c55e' },
    error: { background: '#ef4444' },
  }

  const labels: Record<string, string> = {
    idle: 'Wyslij dane logowania na email',
    sending: 'Wysylanie...',
    sent: 'Wyslano!',
    error: 'Blad - sprobuj ponownie',
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button
        type="button"
        onClick={handleSend}
        disabled={status === 'sending'}
        style={{
          padding: '8px 16px',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: status === 'sending' ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          transition: 'background 0.2s',
          ...buttonStyles[status],
        }}
      >
        {labels[status]}
      </button>
      {errorMsg && (
        <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errorMsg}</p>
      )}
    </div>
  )
}

export default SendCredentialsButton
