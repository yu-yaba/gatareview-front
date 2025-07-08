'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function SessionDebugPage() {
  const { data: session, status } = useSession()
  const [sessionDetails, setSessionDetails] = useState<string>('')

  useEffect(() => {
    if (session) {
      setSessionDetails(JSON.stringify(session, null, 2))
    }
  }, [session])

  const testBackendConnection = async () => {
    try {
      console.log('Testing backend connection...')
      console.log('Session:', session)
      console.log('Backend token:', session?.backendToken)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${session?.backendToken}`,
          'Content-Type': 'application/json',
        },
      })
      
      console.log('Backend response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Backend response data:', data)
        alert('Backend connection successful!')
      } else {
        const errorText = await response.text()
        console.error('Backend error:', errorText)
        alert(`Backend connection failed: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Connection error:', error)
      alert(`Connection error: ${error}`)
    }
  }

  const testGoogleAuth = async () => {
    try {
      console.log('Testing Google auth with backend...')
      
      // 現在のセッションからGoogle access tokenを取得を試行
      const response = await fetch('/api/auth/session')
      const sessionData = await response.json()
      console.log('Current session data:', sessionData)
      
      // Google ID tokenがない場合のテスト
      const testPayload = {
        token: 'test-token-for-debugging'
      }
      
      console.log('Sending test request to backend...')
      const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      })
      
      console.log('Backend response status:', backendResponse.status)
      console.log('Backend response headers:', Object.fromEntries(backendResponse.headers.entries()))
      
      if (backendResponse.ok) {
        const data = await backendResponse.json()
        console.log('Backend success response:', data)
        alert('Backend Google auth test successful!')
      } else {
        const errorText = await backendResponse.text()
        console.log('Backend error response:', errorText)
        alert(`Backend Google auth test failed: ${backendResponse.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Google auth test error:', error)
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
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Session exists:</strong> {session ? 'Yes' : 'No'}</p>
            <p><strong>Backend token exists:</strong> {session?.backendToken ? 'Yes' : 'No'}</p>
            <p><strong>Backend token value:</strong> {session?.backendToken || 'None'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Full Session Object</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
            {sessionDetails || 'No session data'}
          </pre>
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
            
            <button 
              onClick={testGoogleAuth}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Test Google Auth API
            </button>
            
            {!session && (
              <p className="text-red-500 mt-2">Please log in first to test backend connection</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <a 
            href="/"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}