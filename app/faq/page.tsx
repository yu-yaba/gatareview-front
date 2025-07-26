'use client'
import { useState } from 'react'
import { FaChevronDown, FaChevronUp, FaQuestionCircle } from 'react-icons/fa'

interface FAQItem {
  question: string
  answer: string
  category?: string
}

const faqData: FAQItem[] = [
  {
    question: "ガタレビュ！とは何ですか？",
    answer: "ガタレビュ！は新潟大学の学生のための授業レビューサイトです。シラバスではわからないリアルな授業情報を学生同士で共有しましょう。"
  },
  {
    question: "新潟大学の学生でなくても利用できますか？",
    answer: "基本的には新潟大学の学生を対象としていますが、閲覧は誰でも可能です。"
  },
  {
    question: "授業レビューの投稿方法を教えてください",
    answer: "受講した授業を検索し、評価と詳細なレビューを記入して投稿できます。根拠のない暴言などの誹謗中傷は禁止です。"
  },
  {
    question: "どのような授業情報が見られますか？",
    answer: "授業の難易度、教授の教え方、課題の量、テストの形式、出席の重要度など、履修選択に役立つリアルな情報を確認できます。"
  },
  {
    question: "レビューの信頼性はどのように担保されていますか？",
    answer: "不適切なレビューは運営チームが監視・削除しています。また、複数のレビューを参考にすることをお勧めします。"
  },
  {
    question: "利用料金はかかりますか？",
    answer: "ガタレビュ！は完全無料でご利用いただけます。新潟大学生の学習環境向上を目的として運営されています。"
  },
  {
    question: "授業の検索はどのように行えますか？",
    answer: "授業名、教授名、学部名での検索が可能です。また、学部別でのフィルタリングも可能で、効率的に授業を見つけることができます。"
  },
  {
    question: "不適切なレビューを見つけた場合はどうすればよいですか？",
    answer: "フッターの報告フォームをご利用ください。運営チームが内容を確認し、必要に応じて適切な対応を行います。"
  }
]

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50">
        {/* Animated Gradient Overlay */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-100/40 via-transparent to-green-100/40 animate-pulse-slow"></div>

        {/* Large Floating Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-green-200/30 to-green-300/30 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-tl from-blue-200/20 to-green-200/20 rounded-full blur-3xl animate-float-slow-reverse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-green-100/20 via-white/10 to-green-100/20 rounded-full blur-2xl animate-bg-shift"></div>

        {/* Radial Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(29,190,103,0.15)_2px,transparent_2px)] bg-[length:40px_40px] animate-bg-shift"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(34,197,94,0.1)_1px,transparent_1px)] bg-[length:60px_60px] animate-bg-shift" style={{ animationDelay: '2s' }}></div>

        {/* Small Floating Particles */}
        <div className="absolute top-32 left-1/4 w-6 h-6 bg-green-300/40 rounded-full animate-float opacity-60"></div>
        <div className="absolute bottom-32 right-1/4 w-4 h-4 bg-green-400/50 rounded-full animate-float opacity-50" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-green-500/40 rounded-full animate-float opacity-70" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-5 h-5 bg-green-200/60 rounded-full animate-float opacity-40" style={{ animationDelay: '0.5s' }}></div>

        {/* Flowing Background Animation */}
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gradient-to-tr from-green-50/50 via-transparent to-green-100/30 animate-background-flow"></div>
        </div>
      </div>

      {/* Hero Section - Simplified */}
      <section className="pt-20 pb-12 sm:pt-24 sm:pb-16 lg:pt-32 lg:pb-20 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Icon */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/80 backdrop-blur-lg p-4 sm:p-5 lg:p-6 rounded-full shadow-lg border border-white/60 transform hover:rotate-12 transition-all duration-500 hover:shadow-xl group">
                <FaQuestionCircle className="text-4xl sm:text-5xl lg:text-6xl text-green-600 group-hover:text-green-700 transition-colors duration-300" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 bg-gradient-to-r from-green-700 via-green-600 to-green-500 bg-clip-text text-transparent transform hover:scale-105 transition-transform duration-300">
              よくある質問
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              ガタレビュ！についてよくお寄せいただく質問をまとめました
            </p>

            {/* Decorative line */}
            <div className="mt-8 flex justify-center">
              <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-green-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="pb-12 sm:pb-16 lg:pb-20 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 sm:space-y-6">
            {faqData.map((item, index) => (
              <div
                key={index}
                className="bg-white/90 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl border border-white/60 transition-all duration-500 transform hover:scale-[1.01] group relative"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 text-left flex items-start justify-between hover:bg-gradient-to-r hover:from-green-50/50 hover:to-transparent transition-all duration-300 focus:outline-none rounded-2xl sm:rounded-3xl relative"
                  style={{
                    clipPath: openItems.includes(index) ? 'none' : 'inset(0 0 0 0 round 1rem)',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                  aria-expanded={openItems.includes(index)}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                  onFocus={(e) => {
                    e.target.style.outline = 'none';
                    e.target.style.border = 'none';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl sm:rounded-3xl"></div>

                  <div className="flex-1 pr-6 sm:pr-8">
                    <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 relative z-10 transform group-hover:translate-x-1 transition-transform duration-300 leading-relaxed">
                      {item.question}
                    </h2>
                  </div>

                  <div className="flex-shrink-0 relative z-10 mt-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-lg">
                      {openItems.includes(index) ? (
                        <FaChevronUp className="text-white text-xs sm:text-sm" aria-hidden="true" />
                      ) : (
                        <FaChevronDown className="text-white text-xs sm:text-sm" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Answer Section with Proper Animation */}
                <div
                  className={`transition-all duration-500 ease-in-out ${openItems.includes(index)
                    ? 'max-h-96 opacity-100'
                    : 'max-h-0 opacity-0'
                    } overflow-hidden`}
                  id={`faq-answer-${index}`}
                  aria-labelledby={`faq-question-${index}`}
                >
                  <div className="px-4 sm:px-6 lg:px-8 pb-5 sm:pb-6 lg:pb-8">
                    <div className="border-t border-gray-100/80 pt-4 lg:pt-6 relative">
                      <div className="absolute -top-px left-0 w-12 h-px bg-gradient-to-r from-green-500 to-green-400"></div>
                      <div className={`transform transition-all duration-700 ${openItems.includes(index)
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-4 opacity-0'
                        }`}>
                        <p className="text-gray-700 leading-relaxed text-sm sm:text-base lg:text-lg">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="text-center mt-12 sm:mt-16 bg-white/90 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 lg:p-12 border border-white/60 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-transparent to-green-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 transform group-hover:translate-y-1 transition-transform duration-300">
                その他のご質問について
              </h2>
              <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg transform group-hover:translate-y-1 transition-transform duration-300">
                上記で解決しないご質問がございましたら、お気軽にお問い合わせください。
              </p>
              <a
                href="https://forms.gle/kawPCGBi6NB5pfQz8"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl sm:rounded-2xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-500 shadow-lg hover:shadow-xl relative overflow-hidden group text-sm sm:text-base"
              >
                <FaQuestionCircle className="mr-2 sm:mr-3 text-base sm:text-lg relative z-10 transform group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10">お問い合わせ</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 