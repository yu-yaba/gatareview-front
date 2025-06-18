'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // iOS Safari の検出
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsIOS(isIOSDevice && !isStandalone);

    // PWAインストール可能イベントのリスナー
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // アプリがインストールされた後のイベント
    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      setIsVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 開発環境では3秒後にモック表示（デザインと文言は本番と同じ）
    if (process.env.NODE_ENV === 'development') {
      const timer = setTimeout(() => {
        if (!window.matchMedia('(display-mode: standalone)').matches) {
          setShowInstallPrompt(true);
          // モックのdeferredPromptを作成
          const mockPrompt = {
            platforms: ['web'],
            userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
            prompt: async () => {
              console.log('開発環境: PWAインストールプロンプト（モック）');
            }
          } as BeforeInstallPromptEvent;
          setDeferredPrompt(mockPrompt);
        }
      }, 3000);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('PWA インストールが受け入れられました');
        setIsVisible(false);
      } else {
        console.log('PWA インストールが拒否されました');
      }
    } catch (error) {
      console.error('PWA インストールエラー:', error);
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowInstallPrompt(false);

    // 開発環境では短時間で再表示、本番は1週間
    if (process.env.NODE_ENV === 'development') {
      // 開発環境では30秒後に再表示
      setTimeout(() => {
        setIsVisible(true);
        setShowInstallPrompt(true);
      }, 30000);
    } else {
      // 本番環境では1週間後に再表示
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }
  };

  // 1週間内にdismissされた場合は表示しない（本番環境のみ）
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) {
        const dismissTime = parseInt(dismissed);
        const weekInMs = 7 * 24 * 60 * 60 * 1000; // 1週間
        if (Date.now() - dismissTime < weekInMs) {
          setShowInstallPrompt(false);
          setIsVisible(false);
        }
      }
    }
  }, []);

  // PWAとして既にインストールされているかチェック
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;

    if (isStandalone || isInWebAppiOS) {
      setShowInstallPrompt(false);
      setIsVisible(false);
    }
  }, []);

  if (!isVisible || (!showInstallPrompt && !isIOS)) return null;

  return (
    <>
      {/* Android/Chrome用のインストールプロンプト */}
      {showInstallPrompt && deferredPrompt && (
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-slide-up">
          <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl p-5 mx-auto max-w-sm">
            <div className="relative">
              {/* ヘッダー */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="relative w-12 h-12 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                      <Image
                        src="/icon-96x96.png"
                        alt="ガタレビュ"
                        width={40}
                        height={40}
                        className="rounded-lg"
                        priority
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">ガタレビュ</h3>
                    <p className="text-sm text-gray-600">新潟大学授業レビューサイト</p>
                  </div>
                </div>

                <button
                  onClick={handleDismiss}
                  className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                  aria-label="閉じる"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* メッセージ */}
              <div className="mb-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  ホーム画面に追加してアプリのように快適に利用できます
                </p>
              </div>

              {/* ボタン */}
              <div className="flex space-x-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-200 text-sm"
                >
                  後で
                </button>
                <button
                  onClick={handleInstallClick}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  インストール
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari用の手動インストール指示 */}
      {isIOS && (
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-slide-up">
          <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl p-5 mx-auto max-w-sm">
            <div className="relative">
              {/* ヘッダー */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="relative w-12 h-12 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                      <Image
                        src="/icon-96x96.png"
                        alt="ガタレビュ"
                        width={40}
                        height={40}
                        className="rounded-lg"
                        priority
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">ホーム画面に追加</h3>
                    <p className="text-sm text-gray-600">アプリのように使用できます</p>
                  </div>
                </div>

                <button
                  onClick={handleDismiss}
                  className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                  aria-label="閉じる"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 手順説明 */}
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center space-x-3 text-sm text-gray-700 mb-3">
                  <span className="flex items-center justify-center w-7 h-7 bg-green-600 text-white rounded-full text-xs font-bold">1</span>
                  <span className="font-medium">画面下部の</span>
                  <div className="flex items-center justify-center w-10 h-7 bg-green-600 text-white rounded-md text-xs font-bold shadow-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .9 2 2z" />
                    </svg>
                  </div>
                  <span className="font-medium">共有ボタンをタップ</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 text-sm text-gray-700">
                    <span className="flex items-center justify-center w-7 h-7 bg-green-600 text-white rounded-full text-xs font-bold flex-shrink-0">2</span>
                    <span className="font-medium">メニューから以下をタップ</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="flex items-center px-3 py-2 bg-gray-200 rounded-lg text-sm font-bold">
                      <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                      </svg>
                      ホーム画面に追加
                    </div>
                  </div>
                </div>
              </div>

              {/* ボタン */}
              <button
                onClick={handleDismiss}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                理解しました
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 