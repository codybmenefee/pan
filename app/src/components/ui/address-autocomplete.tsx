import * as React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './input'
import { useAddressSearch, type AddressSuggestion } from '@/lib/hooks/useAddressSearch'

export type { AddressSuggestion }

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (suggestion: AddressSuggestion) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  icon?: React.ElementType
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  disabled,
  className,
  id,
  icon: Icon,
}: AddressAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)

  const { suggestions, isLoading, search, clear } = useAddressSearch()

  const listboxId = id ? `${id}-listbox` : 'address-listbox'

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      onChange(newValue)
      search(newValue)
      setIsOpen(true)
      setHighlightedIndex(-1)
    },
    [onChange, search]
  )

  // Handle suggestion selection
  const handleSelect = useCallback(
    (suggestion: AddressSuggestion) => {
      // Preserve user's house number if they typed one and the suggestion doesn't have one
      const userHouseNumber = value.match(/^\s*(\d+[\w-]*)\s+/)?.[1]
      const suggestionHasNumber = /^\s*\d/.test(suggestion.displayName)

      let finalValue = suggestion.displayName
      if (userHouseNumber && !suggestionHasNumber) {
        finalValue = `${userHouseNumber} ${suggestion.displayName}`
      }

      onChange(finalValue)
      onSelect?.(suggestion)
      clear()
      setIsOpen(false)
      setHighlightedIndex(-1)
    },
    [onChange, onSelect, clear, value]
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || suggestions.length === 0) {
        if (e.key === 'ArrowDown' && suggestions.length > 0) {
          setIsOpen(true)
          setHighlightedIndex(0)
          e.preventDefault()
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
            handleSelect(suggestions[highlightedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setHighlightedIndex(-1)
          break
        case 'Tab':
          setIsOpen(false)
          break
      }
    },
    [isOpen, suggestions, highlightedIndex, handleSelect]
  )

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listboxRef.current) {
      const item = listboxRef.current.children[highlightedIndex] as HTMLElement
      if (item) {
        item.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown when suggestions are empty
  useEffect(() => {
    if (suggestions.length === 0 && !isLoading) {
      setHighlightedIndex(-1)
    }
  }, [suggestions.length, isLoading])

  const showDropdown = isOpen && (suggestions.length > 0 || isLoading)

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        )}
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(Icon && 'pl-9', className)}
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-activedescendant={
            highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined
          }
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showDropdown && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover shadow-md"
        >
          {isLoading && suggestions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              Searching...
            </li>
          ) : (
            suggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.displayName}-${index}`}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === highlightedIndex}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm',
                  index === highlightedIndex && 'bg-accent text-accent-foreground'
                )}
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {suggestion.displayName}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
