import { useState, useEffect } from 'react'
import { BridgeQuote, QuoteRequest } from '../types/bridge'
import { SynapseBridge } from '../bridges/synapse'
import { DeBridge } from '../bridges/debridge'

// Array of bridge instances
const bridges = [
  new SynapseBridge(),
  new DeBridge()
]

// Refresh interval in milliseconds
const REFRESH_INTERVAL = 10000 // 10 seconds

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

    // Initial fetch
    fetchQuotes()

    // Set up interval for periodic refreshes
    const intervalId = setInterval(fetchQuotes, REFRESH_INTERVAL)

    // Cleanup interval on unmount or when request changes
    return () => clearInterval(intervalId)
  }, [request])

  return { quotes, loading, error }
}
