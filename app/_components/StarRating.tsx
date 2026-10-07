'use client'

import { useState, type KeyboardEvent } from 'react'

interface StarRatingProps {
  value?: number
  count?: number
  size?: number
  edit?: boolean
  half?: boolean
  color1?: string
  color2?: string
  className?: string
  onChange?: (value: number) => void
  'aria-label'?: string
}

const starPath = 'M12 2.25 15.09 8.51 22 9.51 17 14.39 18.18 21.28 12 18.03 5.82 21.28 7 14.39 2 9.51 8.91 8.51Z'

function Star({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', pointerEvents: 'none' }}
    >
      <path d={starPath} />
    </svg>
  )
}

export default function StarRating({
  value = 0,
  count = 5,
  size = 15,
  edit = true,
  half = true,
  color1 = 'gray',
  color2 = '#ffd700',
  className = '',
  onChange,
  'aria-label': ariaLabel = '評価',
}: StarRatingProps) {
  const [preview, setPreview] = useState<number | null>(null)
  const starCount = Number.isFinite(count) && count >= 1 ? Math.floor(count) : 5
  const starSize = Number.isFinite(size) && size > 0 ? size : 15
  const step = half ? 0.5 : 1
  const currentValue = Number.isFinite(value) ? Math.max(0, Math.min(starCount, value)) : 0
  const displayedValue = edit && preview !== null ? preview : currentValue
  // Match the existing display: a fraction below 0.5 leaves the next star empty.
  const filledValue = half ? Math.floor(displayedValue * 2) / 2 : Math.round(displayedValue)

  const pointerValue = (index: number, clientX: number, element: HTMLSpanElement) => {
    const bounds = element.getBoundingClientRect()
    return index + (half && clientX - bounds.left <= bounds.width / 2 ? 0.5 : 1)
  }

  const changeValue = (nextValue: number) => {
    setPreview(null)
    onChange?.(Math.max(step, Math.min(starCount, nextValue)))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let nextValue: number
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        nextValue = Math.floor(currentValue / step) * step + step
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        nextValue = Math.ceil(currentValue / step) * step - step
        break
      case 'Home':
        nextValue = step
        break
      case 'End':
        nextValue = starCount
        break
      case 'Enter':
      case ' ':
        nextValue = preview ?? Math.round(currentValue / step) * step
        break
      case 'Escape':
        setPreview(null)
        return
      default:
        return
    }
    event.preventDefault()
    changeValue(nextValue)
  }

  return (
    <div
      className={`rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500 ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
      role={edit ? 'slider' : 'img'}
      aria-label={edit ? ariaLabel : `${starCount}点満点中${currentValue}点`}
      aria-valuemin={edit ? Math.min(step, currentValue) : undefined}
      aria-valuemax={edit ? starCount : undefined}
      aria-valuenow={edit ? currentValue : undefined}
      aria-valuetext={edit ? `${starCount}点満点中${currentValue}点` : undefined}
      tabIndex={edit ? 0 : undefined}
      onKeyDown={edit ? handleKeyDown : undefined}
      onPointerLeave={edit ? () => setPreview(null) : undefined}
      onBlur={edit ? () => setPreview(null) : undefined}
    >
      {Array.from({ length: starCount }, (_, index) => {
        const fill = Math.max(0, Math.min(1, filledValue - index))
        return (
          <span
            key={index}
            data-index={index}
            aria-hidden="true"
            style={{
              display: 'block',
              position: 'relative',
              width: starSize,
              height: starSize,
              flexShrink: 0,
              cursor: edit ? 'pointer' : 'default',
            }}
            onPointerMove={edit ? event => {
              if (event.pointerType !== 'touch') {
                setPreview(pointerValue(index, event.clientX, event.currentTarget))
              }
            } : undefined}
            onClick={edit ? event => {
              event.currentTarget.parentElement?.focus()
              changeValue(pointerValue(index, event.clientX, event.currentTarget))
            } : undefined}
          >
            <Star size={starSize} color={color1} />
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: `${fill * 100}%`,
                height: '100%',
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
            >
              <Star size={starSize} color={color2} />
            </span>
          </span>
        )
      })}
    </div>
  )
}
