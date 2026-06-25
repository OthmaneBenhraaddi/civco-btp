import { useCallback, useState } from 'react'

export function useCommercialPrint({ printCount, onIncrement }) {
  const [copyVariant, setCopyVariant] = useState('original')
  const [printing, setPrinting] = useState(false)

  const handlePrint = useCallback(async () => {
    const variant = (printCount ?? 0) === 0 ? 'original' : 'copy'
    setCopyVariant(variant)
    setPrinting(true)

    try {
      await onIncrement()
    } catch (error) {
      setPrinting(false)
      throw error
    }

    window.requestAnimationFrame(() => {
      window.print()
      setPrinting(false)
    })
  }, [onIncrement, printCount])

  return {
    copyVariant,
    printing,
    handlePrint,
  }
}
