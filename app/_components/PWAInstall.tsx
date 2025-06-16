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
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

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
    setShowInstallPrompt(false);
    // 1週間後に再表示
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // 1週間内にdismissされた場合は表示しない
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissTime = parseInt(dismissed);
      const weekInMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissTime < weekInMs) {
        setShowInstallPrompt(false);
      }
    }
  }, []);

  // PWAとして既にインストールされているかチェック
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;

    if (isStandalone || isInWebAppiOS) {
      setShowInstallPrompt(false);
    }
  }, []);

  if (!showInstallPrompt && !isIOS) return null;

  return (
    <>
      {/* Android/Chrome用のインストールプロンプト */}
      {showInstallPrompt && deferredPrompt && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 mx-auto max-w-sm animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative w-10 h-10 mr-3">
                <Image
                  src="/icon-96x96.png"
                  alt="ガタレビュ"
                  width={40}
                  height={40}
                  className="rounded-lg"
                  priority
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">ガタレビュ</p>
                <p className="text-xs text-gray-600">アプリをインストール</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
                aria-label="閉じる"
              >
                ✕
              </button>
              <button
                onClick={handleInstallClick}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                インストール
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari用の手動インストール指示 */}
      {isIOS && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-blue-50 border border-blue-200 rounded-lg p-4 mx-auto max-w-sm animate-slide-up">
          <div className="flex items-start">
            <div className="flex-shrink-0 relative w-10 h-10">
              <Image
                src="/icon-96x96.png"
                alt="ガタレビュ"
                width={40}
                height={40}
                className="rounded-lg"
                priority
              />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-blue-900">
                ホーム画面に追加
              </h3>
              <p className="text-xs text-blue-700 mt-1">
                Safariで <span className="font-mono bg-blue-100 px-1 rounded">⎙</span> → 「ホーム画面に追加」でアプリのように使えます
              </p>
              <button
                onClick={handleDismiss}
                className="text-xs text-blue-600 hover:text-blue-800 mt-2 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 