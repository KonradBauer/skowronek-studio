'use client'

export function LogoutButton() {
  const handleLogout = async () => {
    await fetch('/api/clients/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="cursor-pointer text-sm text-body transition-colors hover:text-primary"
    >
      Wyloguj
    </button>
  )
}
