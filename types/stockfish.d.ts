declare module 'stockfish' {
  export type StockfishMessage = string | { data: string }
  export interface StockfishInstance {
    postMessage(command: string): void
    onmessage?: ((message: StockfishMessage) => void) | null
  }
  export default function Stockfish(options?: Record<string, unknown>): StockfishInstance
}

declare module 'chess.js' {
  export class Chess {
    constructor(fen?: string)
    move(move: string | { from: string; to: string; promotion?: string }): any
    moves(options?: { square?: string; verbose?: boolean }): string[]
    fen(): string
    pgn(): string
    game_over(): boolean
    in_check(): boolean
    in_checkmate(): boolean
    in_stalemate(): boolean
    turn(): 'w' | 'b'
    board(): any[][]
    get(square: string): any
    put(piece: any, square: string): boolean
    remove(square: string): any
    reset(): void
    undo(): any
  }
}
