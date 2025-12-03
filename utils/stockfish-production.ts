// Production-safe Stockfish worker factory
export default async function createStockfish(): Promise<Worker> {
  if (typeof window === 'undefined') {
    throw new Error('Stockfish can only be initialised on the client')
  }

  // Strategy 1: Try worker from public folder (most reliable for production)
  try {
    const w = new Worker('/stockfish.js')
    return w
  } catch (err) {
    // ignore and try next strategy
  }

  // Strategy 2: Try to import stockfish worker dynamically
  try {
    const { default: StockfishWorker } = await import('stockfish/src/stockfish-nnue-16-single.js?worker') as any
    return new StockfishWorker()
  } catch (err) {
    // ignore and try next strategy
  }

  // Strategy 3: Try node_modules URL (last resort)
  try {
    const url = new URL('../../node_modules/stockfish/src/stockfish-nnue-16-single.js', import.meta.url)
    const w = new Worker(url, { type: 'module' })
    return w
  } catch (err) {
    console.error('Unable to instantiate Stockfish engine with any fallback strategy', err)
    throw new Error('Unable to initialise Stockfish engine in this environment')
  }
}