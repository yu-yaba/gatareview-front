'use client'

import { useEffect } from 'react'
import { FaExclamationTriangle, FaHome, FaRedo, FaQuestionCircle } from 'react-icons/fa'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('エラーが発生しました:', error)
  }, [error])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-orange-50">
        {/* Animated Gradient Overlay */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-100/40 via-transparent to-red-100/40 animate-pulse-slow"></div>

        {/* Large Floating Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-red-200/30 to-orange-300/30 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-tl from-orange-200/20 to-red-200/20 rounded-full blur-3xl animate-float-slow-reverse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-red-100/20 via-white/10 to-red-100/20 rounded-full blur-2xl animate-bg-shift"></div>

        {/* Radial Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(239,68,68,0.15)_2px,transparent_2px)] bg-[length:40px_40px] animate-bg-shift"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(249,115,22,0.1)_1px,transparent_1px)] bg-[length:60px_60px] animate-bg-shift" style={{ animationDelay: '2s' }}></div>

        {/* Small Floating Particles */}
        <div className="absolute top-32 left-1/4 w-6 h-6 bg-red-300/40 rounded-full animate-float opacity-60"></div>
        <div className="absolute bottom-32 right-1/4 w-4 h-4 bg-red-400/50 rounded-full animate-float opacity-50" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-red-500/40 rounded-full animate-float opacity-70" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-5 h-5 bg-orange-200/60 rounded-full animate-float opacity-40" style={{ animationDelay: '0.5s' }}></div>

        {/* Flowing Background Animation */}
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gradient-to-tr from-red-50/50 via-transparent to-orange-100/30 animate-background-flow"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-md mx-auto w-full">
          {/* Main Card */}
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/60 p-8 sm:p-10 relative overflow-hidden group">
            {/* Card Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 via-transparent to-orange-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            <div className="relative z-10 text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 mb-6 transform hover:rotate-12 transition-all duration-500 shadow-lg group-hover:shadow-2xl">
                <FaExclamationTriangle className="h-10 w-10 text-white animate-pulse" aria-hidden="true" />
              </div>

              {/* Error Title */}
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4 transform hover:scale-105 transition-transform duration-300">
                エラーが発生しました
              </h1>

              {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed transform group-hover:translate-y-1 transition-transform duration-300">
                申し訳ございません。予期しないエラーが発生しました。
                <br className="hidden sm:block" />
                しばらく時間をおいてから再度お試しください。
              </p>

              {/* Error ID */}
              {error.digest && (
                <div className="mb-6 p-3 bg-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200/80">
                  <p className="text-xs text-gray-500 font-mono">
                    エラーID: {error.digest}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4">
                {/* Primary Button - Retry */}
                <button
                  onClick={reset}
                  className="w-full inline-flex justify-center items-center px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-500 shadow-lg hover:shadow-2xl relative overflow-hidden group/btn"
                >
                  <FaRedo className="mr-3 text-lg relative z-10 transform group-hover/btn:rotate-180 transition-transform duration-500" />
                  <span className="relative z-10">再試行</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 animate-shimmer opacity-0 group-hover/btn:opacity-30 transition-opacity duration-500"></div>
                </button>

                {/* Secondary Button - Home */}
                <a
                  href="/"
                  className="w-full inline-flex justify-center items-center px-6 py-4 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-2xl border-2 border-gray-200/80 hover:border-green-300 hover:bg-green-50/80 transform hover:scale-105 transition-all duration-500 shadow-lg hover:shadow-xl relative overflow-hidden group/btn"
                >
                  <FaHome className="mr-3 text-lg relative z-10 transform group-hover/btn:rotate-12 transition-transform duration-300" />
                  <span className="relative z-10">ホームに戻る</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-green-100 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                </a>
              </div>
            </div>
          </div>

          {/* Additional Help Card */}
          <div className="mt-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/60 p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-green-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            <div className="relative z-10 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 transform group-hover:translate-y-1 transition-transform duration-300">
                問題が解決しない場合
              </h3>
              <p className="text-gray-600 text-sm mb-4 transform group-hover:translate-y-1 transition-transform duration-300">
                繰り返しエラーが発生する場合は、サポートまでご連絡ください
              </p>
              <a
                href="https://forms.gle/kawPCGBi6NB5pfQz8"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-green-600 hover:text-green-700 font-medium text-sm transform hover:scale-105 transition-all duration-300"
              >
                <FaQuestionCircle className="mr-2" />
                サポートに連絡
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 