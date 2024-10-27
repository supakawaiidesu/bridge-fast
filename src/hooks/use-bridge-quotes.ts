import { useState, useEffect } from 'react'
import { BridgeQuote, QuoteRequest } from '../types/bridge'
import { SynapseBridge } from '../bridges/synapse'

// Array of bridge instances - we'll add more bridges here later
const bridges = [
  new SynapseBridge()
]

export function useBridgeQuotes(request: QuoteRequest | null) {
  const [quotes, setQuotes] = useState<BridgeQuote[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchQuotes() {
      if (!request) return

      setLoading(true)
      setError(null)
      const newQuotes: BridgeQuote[] = []

      try {
        // Fetch quotes from all bridges in parallel
        const quotePromises = bridges.map(bridge => 
          bridge.getQuote(request)
            .then(quote => newQuotes.push(quote))
            .catch(err => console.error(`${bridge.name} quote failed:`, err))
        )

        await Promise.all(quotePromises)
        
        // Sort quotes by expected output (best rate first)
        newQuotes.sort((a, b) => 
          b.expectedOutput.gt(a.expectedOutput) ? 1 : -1
        )

        setQuotes(newQuotes)
      } catch (err) {
        setError('Failed to fetch quotes')
        console.error('Quote error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchQuotes()
  }, [request])

  return { quotes, loading, error }
}
