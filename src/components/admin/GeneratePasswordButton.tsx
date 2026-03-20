'use client'

import { useState } from 'react'

function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => chars[byte % chars.length]).join('')
}

export const GeneratePasswordButton = () => {
  const [copied, setCopied] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')

  const handleGenerate = async () => {
    const password = generatePassword()
    setGeneratedPassword(password)

    // Set password + confirm-password fields via DOM (Payload auth collections require both)
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set

    for (const fieldId of ['field-password', 'field-confirm-password']) {
      const input = document.getElementById(fieldId) as HTMLInputElement
      if (input && nativeInputValueSetter) {
        nativeInputValueSetter.call(input, password)
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }

    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 5000)
    } catch {
      window.prompt('Skopiuj haslo:', password)
    }
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleGenerate}
          style={{
            padding: '8px 16px',
            background: copied ? '#22c55e' : '#8B7355',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'background 0.2s',
          }}
        >
          {copied ? 'Skopiowano do schowka!' : 'Generuj haslo'}
        </button>
        {generatedPassword && (
          <code
            style={{
              padding: '4px 8px',
              background: '#f3f4f6',
              borderRadius: '4px',
              fontSize: '13px',
              fontFamily: 'monospace',
              color: '#333',
              userSelect: 'all',
            }}
          >
            {generatedPassword}
          </code>
        )}
      </div>
      {generatedPassword && (
        <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
          Wklej to haslo w pole &quot;Password&quot; ponizej, a nastepnie zapisz klienta.
        </p>
      )}
    </div>
  )
}

export default GeneratePasswordButton
