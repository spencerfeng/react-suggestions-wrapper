import * as React from 'react'
import { useImperativeHandle, useRef } from 'react'

export interface ShadowInputRef {
  wrapper: HTMLDivElement | null
  caret: HTMLSpanElement | null
}

interface Props {
  text: string
  caretStart: number | null
  caretEnd: number | null
}

const ShadowInput = React.forwardRef<ShadowInputRef, Props>((props: Props, ref) => {
  const divRef = useRef<HTMLDivElement>(null)
  const caretRef = useRef<HTMLSpanElement>(null)
  const { caretStart, caretEnd, text } = props

  useImperativeHandle(ref, () => ({
    get wrapper(): HTMLDivElement | null {
      return divRef.current
    },
    get caret(): HTMLSpanElement | null {
      return caretRef.current
    }
  }))

  const textBeforePositionIndicator = (): string => {
    if (caretStart !== null) {
      return text.substring(0, caretStart)
    }
    return ''
  }

  const textForPositionIndicator = (): string => {
    if (caretStart !== null && caretEnd !== null) {
      return text.substring(caretStart, caretEnd + 1)
    }
    return ''
  }

  const textAfterPositionIndicator = (): string => {
    if (caretEnd !== null) {
      return text.substring(caretEnd + 1)
    }
    return ''
  }

  if (caretStart !== null && caretEnd !== null) {
    return (
      <div ref={divRef}>
        {textBeforePositionIndicator()}
        <span ref={caretRef}>{textForPositionIndicator()}</span>
        {textAfterPositionIndicator()}
      </div>
    )
  }

  return <div ref={divRef}>{text}</div>
})

ShadowInput.displayName = 'ShadowInput'

export default ShadowInput
