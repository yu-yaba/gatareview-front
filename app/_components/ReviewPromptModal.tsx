'use client'

import { useState } from 'react'
import Modal from 'react-modal'
import Link from 'next/link'
import { FaTimes, FaArrowRight, FaPencilAlt, FaUserCircle, FaComments, FaBookOpen, FaHeart } from 'react-icons/fa'
import { useAuth } from '../_hooks/useAuth'

interface ReviewPromptModalProps {
  isOpen: boolean
  onClose: () => void
  lectureId: number
}

export default function ReviewPromptModal({ isOpen, onClose, lectureId }: ReviewPromptModalProps) {
  const { isAuthenticated } = useAuth()

  const getModalContent = () => {
    if (!isAuthenticated) {
      // 未ログインユーザー向け
      return {
        icon: <FaUserCircle className="text-3xl md:text-4xl text-orange-500" />,
        title: 'ログイン&1レビューを投稿すると閲覧できます。',
        color: 'from-orange-500 to-yellow-500',
        buttonText: 'ログインする',
        buttonLink: '/auth/signin'
      }
    } else {
      // ログイン済みだが未投稿ユーザー向け
      return {
        icon: <FaPencilAlt className="text-3xl md:text-4xl text-pink-500" />,
        title: 'レビューを投稿して、他の学生と情報を共有しましょう。',
        color: 'from-pink-500 to-rose-500',
        buttonText: 'レビューを投稿する',
        buttonLink: '/lectures'
      }
    }
  }

  const modalContent = getModalContent()

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      overlayClassName="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md"
      ariaHideApp={false}
    >
      <div className="bg-white rounded-3xl p-4 md:p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-100 relative overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* 背景エフェクト */}
        <div className={`absolute inset-0 bg-gradient-to-br ${isAuthenticated ? 'from-pink-50/30' : 'from-orange-50/30'} via-transparent ${isAuthenticated ? 'to-rose-100/30' : 'to-yellow-100/30'} pointer-events-none`}></div>
        <div className={`absolute top-10 right-10 w-20 h-20 ${isAuthenticated ? 'bg-pink-100' : 'bg-orange-100'} rounded-full opacity-20 animate-float`}></div>
        <div className={`absolute bottom-10 left-10 w-16 h-16 ${isAuthenticated ? 'bg-rose-200' : 'bg-yellow-200'} rounded-full opacity-15 animate-float`} style={{ animationDelay: '1s' }}></div>

        {/* 閉じるボタン */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 z-20 pointer-events-auto"
        >
          <FaTimes className="text-gray-400 hover:text-gray-600" />
        </button>

        {/* コンテンツ */}
        <div className="relative z-10">
          {/* アイコンとタイトル */}
          <div className="text-center mb-4">
            <div className="flex justify-center mb-3">
              <div className="p-3 md:p-4 bg-gray-50 rounded-full">
                {modalContent.icon}
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {modalContent.title}
            </h2>
          </div>

          {/* 説明セクション */}
          <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-red-50 rounded-xl p-4 mb-4 border border-rose-200/30 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-100/20 to-rose-100/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-center justify-center mb-2 relative z-10">
              <FaHeart className="text-rose-500 text-xl mr-3 animate-pulse drop-shadow-sm" />
              <h3 className="text-base md:text-lg font-bold text-rose-800 text-center leading-relaxed">新大生の皆さんがあなたのレビューを待っています！</h3>
            </div>
            <div className="absolute top-1 right-3 w-2 h-2 bg-pink-300 rounded-full animate-twinkle opacity-60"></div>
            <div className="absolute bottom-2 left-4 w-1.5 h-1.5 bg-rose-400 rounded-full animate-twinkle opacity-50" style={{ animationDelay: '1s' }}></div>
          </div>

          {/* レビュー投稿のメリット */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 p-2 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100">
              <div className={`w-7 h-7 bg-gradient-to-br ${isAuthenticated ? 'from-pink-500 to-rose-500' : 'from-orange-500 to-yellow-500'} rounded-lg flex items-center justify-center text-white text-xs`}>
                <FaBookOpen />
              </div>
              <span className="text-sm text-gray-700 font-medium">最短1分で完了します</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100">
              <div className={`w-7 h-7 bg-gradient-to-br ${isAuthenticated ? 'from-pink-500 to-rose-500' : 'from-purple-500 to-pink-500'} rounded-lg flex items-center justify-center text-white text-xs`}>
                💖
              </div>
              <span className="text-sm text-gray-700 font-medium">後輩学生にも情報を提供しましょう！</span>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="space-y-2">
            <Link href={modalContent.buttonLink} onClick={onClose}>
              <button className={`w-full px-4 py-3 bg-gradient-to-r ${modalContent.color} text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center group relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <FaArrowRight className="mr-2 transition-transform duration-300 group-hover:translate-x-1" />
                <span className="relative">{modalContent.buttonText}</span>
              </button>
            </Link>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors duration-200"
            >
              後で
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
