import React, { useEffect, useState, useRef, useCallback } from 'react'

export interface DecryptedTextProps {
  text: string
  speed?: number
  maxIterations?: number
  characters?: string
  className?: string
  encryptedClassName?: string
  animateOnHover?: boolean
}

export const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 40,
  maxIterations = 10,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*',
  className = '',
  encryptedClassName = 'text-emerald-400 opacity-80',
  animateOnHover = true,
}) => {
  const [displayText, setDisplayText] = useState(text)


  const iterationRef = useRef(0)
  const intervalRef = useRef<number | null>(null)
  const isScramblingRef = useRef(false)

  const triggerScramble = useCallback(() => {
    if (isScramblingRef.current) return
    isScramblingRef.current = true
    iterationRef.current = 0

    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = window.setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' '
            if (index < iterationRef.current) {
              return text[index]
            }
            return characters[Math.floor(Math.random() * characters.length)]
          })
          .join('')
      )

      if (iterationRef.current >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        isScramblingRef.current = false
        setDisplayText(text)
      }

      iterationRef.current += 1 / (maxIterations / text.length)
    }, speed)
  }, [text, speed, maxIterations, characters])

  useEffect(() => {
    triggerScramble()

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [triggerScramble])


  return (
    <span
      className={`inline-block cursor-default select-none font-mono ${className}`}
      onMouseEnter={() => {
        if (animateOnHover) triggerScramble()
      }}

    >
      {displayText.split('').map((char, i) => {
        const isOriginal = char === text[i]
        return (
          <span
            key={i}
            className={!isOriginal ? encryptedClassName : undefined}
          >
            {char}
          </span>
        )
      })}
    </span>
  )
}
