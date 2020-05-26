import * as React from 'react'
import { useRef, useEffect, useState } from 'react'
import ShadowInput, { ShadowInputRef } from '../ShadowInput'
import SuggestionsOverlay from '../SuggestionsOverlay'

import './index.scss'

const escapeRegex = (str: string): string => str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')

const getTriggerRegex = (trigger: string): RegExp => {
  const escapedTriggerChar = escapeRegex(trigger)
  return new RegExp(`(?:^|\\s)(${escapedTriggerChar}([^${escapedTriggerChar}\\s]*))$`)
}

const KEYS = {
  TAB: 9,
  RETURN: 13,
  ESC: 27,
  UP: 38,
  DOWN: 40
}

export type ReactSuggestionsWrapperProps = {
  children: JSX.Element // we only allow a single JSX element as the children
  trigger: string
  suggestions: string[]
}

const ReactSuggestionsWrapper: React.FC<ReactSuggestionsWrapperProps> = (props: ReactSuggestionsWrapperProps) => {
  const triggerRegex = getTriggerRegex(props.trigger)
  const [text, setText] = useState('')
  const [caretStart, setCaretStart] = useState<number | null>(null)
  const [caretEnd, setCaretEnd] = useState<number | null>(null)
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState<number | null>(null)
  const [cursorIndex, setCursorIndex] = useState<number | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const shadowInputRef = useRef<ShadowInputRef>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const shouldShowSuggestions = (): boolean => caretStart !== null && caretEnd !== null

  const handleClick = (e: MouseEvent): void => {
    if (!suggestionsRef) return
    if (!suggestionsRef.current) return
    if (suggestionsRef.current.contains(e.target as Node)) {
      return
    }

    setCaretStart(null)
    setCaretEnd(null)
  }

  // register and unregister a handler to handle mousedown event to deal with the need to dismiss suggestions
  // overlay when the user clicks outside the overlay
  // reference: https://medium.com/@pitipatdop/little-neat-trick-to-capture-click-outside-with-react-hook-ba77c37c7e82
  useEffect(() => {
    document.addEventListener('mousedown', handleClick)

    return (): void => {
      document.removeEventListener('mousedown', handleClick)
    }
  }, [])

  useEffect(() => {
    if (inputRef?.current && shadowInputRef?.current?.wrapper) {
      const inputStyle = getComputedStyle(inputRef.current)
      shadowInputRef.current.wrapper.style.cssText += inputStyle.cssText
      shadowInputRef.current.wrapper.style.position = 'absolute'
      shadowInputRef.current.wrapper.style.top = '0px'
      shadowInputRef.current.wrapper.style.left = '0px'
      shadowInputRef.current.wrapper.style.zIndex = '-1'
    }

    if (suggestionsRef?.current && shadowInputRef?.current?.wrapper && wrapperRef?.current) {
      if (shouldShowSuggestions()) {
        const wrapperRect = wrapperRef.current.getBoundingClientRect()
        const caretRect = shadowInputRef.current.caret?.getBoundingClientRect()
        if (wrapperRect && caretRect) {
          const topDiff = caretRect.top - wrapperRect.top
          const leftDiff = caretRect.left - wrapperRect.left

          const lineHeightVal =
            parseFloat(shadowInputRef.current.wrapper.style.lineHeight) ||
            parseFloat(shadowInputRef.current.wrapper.style.fontSize) * 1.2

          suggestionsRef.current.style.top = `${topDiff + lineHeightVal}px`
          suggestionsRef.current.style.left = `${leftDiff}px`
        }
      }
    }
  })

  useEffect(() => {
    if (cursorIndex !== null && inputRef?.current) {
      inputRef.current.setSelectionRange(cursorIndex, cursorIndex)
      setCursorIndex(null)
    }
  }, [cursorIndex])

  const setCaret = (text: string): void => {
    const match = triggerRegex.exec(text)
    if (match) {
      setCaretStart(match.index + 1)
      setCaretEnd(match.index + match[1].length)
    } else {
      setCaretStart(null)
      setCaretEnd(null)
    }
  }

  const handleOnChange = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setText(e.currentTarget.value)

    if (inputRef?.current?.scrollTop && shadowInputRef?.current?.wrapper) {
      shadowInputRef.current.wrapper.scrollTop = inputRef.current.scrollTop
    }

    setCaret(e.currentTarget.value)
  }

  const handleOnSelect = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    if (inputRef?.current) {
      const selectionStart = inputRef.current.selectionStart
      if (selectionStart) {
        setCaret(e.currentTarget.value.substring(0, selectionStart))
      }
    }
  }

  const shiftFocus = (delta: number): void => {
    const suggestionsCount = props.suggestions.length
    const newIndex =
      focusedSuggestionIndex === null
        ? (suggestionsCount - 1 + delta) % suggestionsCount
        : (suggestionsCount + focusedSuggestionIndex + delta) % suggestionsCount

    setFocusedSuggestionIndex(newIndex)
  }

  const selectFocusedItem = (): void => {
    if (focusedSuggestionIndex === null || caretStart === null || caretEnd === null) return
    const focusedText = props.suggestions[focusedSuggestionIndex]

    let textBeforeTextToReplace = ''
    if (caretStart > 1) {
      textBeforeTextToReplace = `${text.substring(0, caretStart)}`
    }
    const textAfterTextToReplace = `${text.substring(caretEnd + 1)}`

    setCursorIndex(`${textBeforeTextToReplace}${focusedText}`.length)

    setText(`${textBeforeTextToReplace}${focusedText}${textAfterTextToReplace}`)

    // dismiss the suggestions overlay
    setCaretStart(null)
    setCaretEnd(null)
  }

  const handleOnKeyDown = (e: React.KeyboardEvent): void => {
    // do not intercept key events if the suggestions overlay is not shown
    if (!suggestionsRef) return

    if (Object.values(KEYS).includes(e.keyCode)) e.preventDefault()
    switch (e.keyCode) {
      // when 'ESC' is clicked, we hide the suggestions overlay
      case KEYS.ESC: {
        setCaretStart(null)
        setCaretEnd(null)
        return
      }
      case KEYS.DOWN: {
        shiftFocus(+1)
        return
      }
      case KEYS.UP: {
        shiftFocus(-1)
        return
      }
      case KEYS.RETURN: {
        selectFocusedItem()
        return
      }
      default:
        return
    }
  }

  return (
    <div className="react-suggestions-wrapper" ref={wrapperRef} onKeyDown={handleOnKeyDown}>
      <props.children.type
        {...props.children.props}
        ref={inputRef}
        onChange={handleOnChange}
        onSelect={handleOnSelect}
        value={text}
      />
      <ShadowInput ref={shadowInputRef} text={text} caretStart={caretStart} caretEnd={caretEnd} />
      {shouldShowSuggestions() && (
        <SuggestionsOverlay
          ref={suggestionsRef}
          suggestions={props.suggestions}
          focusedSuggestionIndex={focusedSuggestionIndex}
        />
      )}
    </div>
  )
}

export default ReactSuggestionsWrapper
