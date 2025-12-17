'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function SessionDebugClient() {
  const { data: session, status } = useSession()
  const [sessionDetails, setSessionDetails] = useState<string>('')

  useEffect(() => {
    if (!session) {
      setSessionDetails('')
      return
    }

    // トークンは表示/ログ出力しない（漏洩防止）
    const safeSession = {
      ...session,
      backendToken: session.backendToken ? '[REDACTED]' : null,
    }
    setSessionDetails(JSON.stringify(safeSession, null, 2))
  }, [session])

  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${session?.backendToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        alert('Backend connection successful!')
      } else {
        const errorText = await response.text()
        alert(`Backend connection failed: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      alert(`Connection error: ${error}`)
    }
  }

  const testGoogleAuth = async () => {
    try {
      // Google ID tokenがない場合のテスト
      const testPayload = {
        token: 'test-token-for-debugging',
      }

      const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      })

      if (backendResponse.ok) {
        alert('Backend Google auth test successful!')
      } else {
        const errorText = await backendResponse.text()
        alert(`Backend Google auth test failed: ${backendResponse.status} - ${errorText}`)
      }
    } catch (error) {
      alert(`Google auth test error: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Session Debug Page</h1>

        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p>
              <strong>Status:</strong> {status}
            </p>
            <p>
              <strong>Session exists:</strong> {session ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Backend token exists:</strong> {session?.backendToken ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Backend token value:</strong> {session?.backendToken ? '[REDACTED]' : 'None'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Full Session Object</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">{sessionDetails || 'No session data'}</pre>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Backend Test Functions</h2>
          <div className="space-y-3">
            <button
              onClick={testBackendConnection}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-3"
              disabled={!session}
            >
              Test Backend Connection
            </button>

            <button onClick={testGoogleAuth} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Test Google Auth API
            </button>

            {!session && <p className="text-red-500 mt-2">Please log in first to test backend connection</p>}
          </div>
        </div>

        <div className="mt-6">
          <a href="/" className="text-blue-500 hover:text-blue-700 underline">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
