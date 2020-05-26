import * as React from 'react'

import './index.scss'

interface Props {
  suggestions: string[]
  focusedSuggestionIndex: number | null
}

type Ref = HTMLDivElement

const SuggestionsOverlay = React.forwardRef<Ref, Props>((props: Props, ref) => {
  return (
    <div ref={ref} className="suggestions-overlay-container">
      <ul>
        {props.suggestions.map((suggestion, index) => {
          if (index === props.focusedSuggestionIndex) {
            return (
              <li key={suggestion} className="focused">
                {suggestion}
              </li>
            )
          }
          return <li key={suggestion}>{suggestion}</li>
        })}
      </ul>
    </div>
  )
})

SuggestionsOverlay.displayName = 'SuggestionsOverlay'

export default SuggestionsOverlay
