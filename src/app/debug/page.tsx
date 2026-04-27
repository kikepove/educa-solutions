'use client'

export const dynamic = 'force-dynamic'

export default function DebugPage() {
  return (
    <div className="p-8">
      <h1>Debug Info</h1>
      <p>Check browser console for environment info</p>
      <button 
        onClick={async () => {
          const res = await fetch('/api/debug')
          const data = await res.json()
          console.log('Debug API Response:', data)
          alert(JSON.stringify(data, null, 2))
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Test Debug API
      </button>
    </div>
  )
}
