export default function AdminLogo() {
  return (
    <div style={{ background: '#ffffff', borderRadius: '8px', padding: '8px 16px', display: 'inline-flex' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Skowronek Studio"
        style={{ height: '150px', width: 'auto', objectFit: 'contain' }}
      />
    </div>
  )
}
