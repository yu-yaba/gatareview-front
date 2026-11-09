'use client'

import { useRef, useState } from 'react'

export interface ReviewSelectFieldProps {
  id: string
  label: string
  options: readonly string[]
  value: string
  isOpen: boolean
  error?: string
  onOpenChange: (open: boolean) => void
  onSelect: (value: string) => void
}

const PLACEHOLDER = '選択してください'

// ページ本体の再描画で作り直されないよう、モジュール直下で定義する（フォーカスが body に落ちるのを防ぐ）。
// キーボード操作は APG の「選択専用コンボボックス」に合わせ、フォーカスはボタンに残したまま候補を移動する。
export default function ReviewSelectField({
  id, label, options, value, isOpen, error, onOpenChange, onSelect,
}: ReviewSelectFieldProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const choices = ['', ...options]
  const labelId = `${id}-label`
  const listboxId = `${id}-listbox`
  const errorId = `${id}-error`
  const optionId = (index: number) => `${id}-option-${index}`

  const open = () => {
    setActiveIndex(Math.max(0, choices.indexOf(value)))
    onOpenChange(true)
  }
  const close = () => {
    setActiveIndex(-1)
    onOpenChange(false)
  }
  const choose = (choice: string) => {
    onSelect(choice)
    close()
    buttonRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault()
        if (!isOpen) {
          open()
          return
        }
        const step = e.key === 'ArrowDown' ? 1 : -1
        setActiveIndex(index => (index + step + choices.length) % choices.length)
        break
      }
      case 'Home':
      case 'End':
        if (!isOpen) return
        e.preventDefault()
        setActiveIndex(e.key === 'Home' ? 0 : choices.length - 1)
        break
      case 'Enter':
      case ' ':
        // 閉じているときはボタン本来のクリックで開く
        if (!isOpen) return
        e.preventDefault()
        if (activeIndex >= 0) choose(choices[activeIndex])
        else close()
        break
      case 'Escape':
        if (!isOpen) return
        e.preventDefault()
        close()
        break
      case 'Tab':
        if (isOpen) close()
        break
    }
  }

  return (
    <div className="mb-6" data-dropdown>
      <p className="font-bold mb-3 text-gray-800">
        <label htmlFor={id} id={labelId}>{label}</label>
        <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          任意
        </span>
      </p>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          id={id}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onClick={() => (isOpen ? close() : open())}
          onKeyDown={handleKeyDown}
          className={`block appearance-none w-full bg-white/95 backdrop-blur-xs p-4 rounded-2xl shadow-md border border-green-100/50 focus:ring-2 focus:outline-hidden cursor-pointer text-gray-800 font-medium transition-colors duration-200 scroll-margin-0 ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'focus:border-green-500 focus:ring-green-200'}`}
          style={{
            textAlign: 'left',
            justifyContent: 'space-between',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <span className={value ? 'text-gray-800' : 'text-gray-500'}>
            {value || PLACEHOLDER}
          </span>
          <svg
            className={`fill-current h-5 w-5 text-green-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
          </svg>
        </button>

        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={labelId}
          hidden={!isOpen}
          className="absolute z-50 w-full mt-1 bg-white border border-green-200 rounded-xl shadow-xl max-h-60 overflow-y-auto"
        >
          {choices.map((choice, index) => {
            const selected = choice === value
            const active = index === activeIndex
            return (
              <li
                key={choice || PLACEHOLDER}
                id={optionId(index)}
                role="option"
                aria-selected={selected}
                // ボタンからフォーカスを奪わずに選択する
                onMouseDown={e => e.preventDefault()}
                onClick={() => choose(choice)}
                className={`w-full px-4 py-3 text-left cursor-pointer transition-colors ${index === 0
                  ? 'text-gray-500'
                  : selected ? 'bg-green-100 text-green-800 font-medium' : 'text-gray-700'
                  } ${active ? (index === 0 ? 'bg-green-100' : 'bg-green-50') : 'hover:bg-green-50'} ${index === choices.length - 1 ? '' : 'border-b border-gray-100'
                  }`}
              >
                {choice || PLACEHOLDER}
              </li>
            )
          })}
        </ul>
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-sm text-red-600 font-medium flex items-center">
          <svg className="w-4 h-4 mr-1 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
