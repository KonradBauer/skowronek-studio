'use client'

import { useState } from 'react'
import { useField } from '@payloadcms/ui'

function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => chars[byte % chars.length]).join('')
}

export const GeneratePasswordButton = () => {
  const { setValue } = useField<string>({ path: 'password' })
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    const password = generatePassword()
    setValue(password)

    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // Fallback: prompt with password
      window.prompt('Skopiuj hasło:', password)
    }
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
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
        {copied ? 'Skopiowano do schowka!' : 'Generuj hasło'}
      </button>
    </div>
  )
}
