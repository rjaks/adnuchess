declare module 'stockfish' {
  export type StockfishMessage = string | { data: string }
  export interface StockfishInstance {
    postMessage(command: string): void
    onmessage?: ((message: StockfishMessage) => void) | null
  }
  export default function Stockfish(options?: Record<string, unknown>): StockfishInstance
}

declare module 'chess.js' {
  export type PieceSymbol = 'p' | 'r' | 'n' | 'b' | 'q' | 'k'
  export type Square = string

  export interface Move {
    color: 'w' | 'b'
    from: Square
    to: Square
    flags: string
    piece: PieceSymbol
    san?: string
    promotion?: string
  }

  export class Chess {
    constructor(fen?: string)
    move(move: string | { from: string; to: string; promotion?: string }): Move | null
    moves(options?: { square?: string; verbose?: boolean }): Move[]
    fen(): string
    pgn(): string
    history(): string[]
    isGameOver(): boolean
    isCheck(): boolean
    isCheckmate(): boolean
    isStalemate(): boolean
    turn(): 'w' | 'b'
    board(): Array<Array<{ type: PieceSymbol; color: 'w' | 'b' } | null>>
    get(square: string): { type: PieceSymbol; color: 'w' | 'b' } | null
    put(piece: { type: PieceSymbol; color: 'w' | 'b' }, square: string): boolean
    remove(square: string): any
    reset(): void
    undo(): Move | null
  }
}
