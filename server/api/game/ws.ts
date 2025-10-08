import { defineWebSocketHandler } from 'h3'

type GamePlayer = {
  id: string
  userId: string
  matchId: string
  ws: any
}

type GameMove = {
  matchId: string
  move: string
  fen: string
  playerId: string
}

// In-memory storage for active games
const gameConnections = new Map<string, GamePlayer[]>() // matchId -> players
const playerConnections = new Map<string, GamePlayer>() // playerId -> player

export default defineWebSocketHandler({
  open(peer) {
    console.log('Game WebSocket connection opened:', peer.id)
  },

  close(peer) {
    console.log('Game WebSocket connection closed:', peer.id)
    
    const player = playerConnections.get(peer.id)
    if (player) {
      // Remove player from game
      const gamePlayers = gameConnections.get(player.matchId)
      if (gamePlayers) {
        const index = gamePlayers.findIndex(p => p.id === peer.id)
        if (index > -1) {
          gamePlayers.splice(index, 1)
          if (gamePlayers.length === 0) {
            gameConnections.delete(player.matchId)
          }
        }
      }
      playerConnections.delete(peer.id)
    }
  },

  error(peer, error) {
    console.error('Game WebSocket error:', error)
  },

  message(peer, message) {
    try {
      const data = JSON.parse(message.text())
      handleGameMessage(peer, data)
    } catch (error) {
      console.error('Invalid game WebSocket message:', error)
      peer.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }))
    }
  }
})

function handleGameMessage(peer: any, data: any) {
  switch (data.type) {
    case 'join_game':
      handleJoinGame(peer, data)
      break
      
    case 'move':
      handleMove(peer, data)
      break
      
    case 'game_end':
      handleGameEnd(peer, data)
      break
      
    case 'chat_message':
      handleChatMessage(peer, data)
      break
      
    case 'resign':
      handleResignation(peer, data)
      break
      
    case 'offer_draw':
      handleDrawOffer(peer, data)
      break
      
    case 'draw_response':
      handleDrawResponse(peer, data)
      break
      
    default:
      peer.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type'
      }))
  }
}

function handleJoinGame(peer: any, data: any) {
  if (!data.matchId) {
    peer.send(JSON.stringify({
      type: 'error',
      message: 'Match ID required'
    }))
    return
  }

  const player: GamePlayer = {
    id: peer.id,
    userId: data.userId || 'anonymous',
    matchId: data.matchId,
    ws: peer
  }

  // Add player to game
  if (!gameConnections.has(data.matchId)) {
    gameConnections.set(data.matchId, [])
  }
  gameConnections.get(data.matchId)!.push(player)
  playerConnections.set(peer.id, player)

  peer.send(JSON.stringify({
    type: 'game_joined',
    matchId: data.matchId
  }))

  console.log(`Player ${peer.id} joined game ${data.matchId}`)
}

function handleMove(peer: any, data: any) {
  const player = playerConnections.get(peer.id)
  if (!player) {
    peer.send(JSON.stringify({
      type: 'error',
      message: 'Player not found'
    }))
    return
  }

  const gamePlayers = gameConnections.get(player.matchId)
  if (!gamePlayers) {
    peer.send(JSON.stringify({
      type: 'error',
      message: 'Game not found'
    }))
    return
  }

  // Broadcast move to opponent
  const opponent = gamePlayers.find(p => p.id !== peer.id)
  if (opponent) {
    try {
      opponent.ws.send(JSON.stringify({
        type: 'opponent_move',
        move: data.move,
        fen: data.fen
      }))
    } catch (error) {
      console.error('Failed to send move to opponent:', error)
    }
  }

  console.log(`Move in game ${player.matchId}: ${data.move}`)
}

function handleGameEnd(peer: any, data: any) {
  const player = playerConnections.get(peer.id)
  if (!player) return

  const gamePlayers = gameConnections.get(player.matchId)
  if (!gamePlayers) return

  // Notify opponent about game end
  const opponent = gamePlayers.find(p => p.id !== peer.id)
  if (opponent) {
    try {
      // Flip the result for the opponent
      let opponentResult: string
      switch (data.result) {
        case 'win':
          opponentResult = 'loss'
          break
        case 'loss':
          opponentResult = 'win'
          break
        default:
          opponentResult = 'draw'
      }

      opponent.ws.send(JSON.stringify({
        type: 'game_ended',
        result: getResultMessage(opponentResult),
        message: getResultDescription(opponentResult),
        playerResult: opponentResult
      }))
    } catch (error) {
      console.error('Failed to notify opponent of game end:', error)
    }
  }

  console.log(`Game ${player.matchId} ended with result: ${data.result}`)
}

function handleChatMessage(peer: any, data: any) {
  const player = playerConnections.get(peer.id)
  if (!player) return

  const gamePlayers = gameConnections.get(player.matchId)
  if (!gamePlayers) return

  // Broadcast chat message to opponent
  const opponent = gamePlayers.find(p => p.id !== peer.id)
  if (opponent) {
    try {
      opponent.ws.send(JSON.stringify({
        type: 'chat_message',
        sender: data.sender,
        message: data.message,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Failed to send chat message to opponent:', error)
    }
  }
}

function getResultMessage(result: string): string {
  switch (result) {
    case 'win':
      return 'You Win!'
    case 'loss':
      return 'You Lose'
    default:
      return 'Draw'
  }
}

function getResultDescription(result: string, reason?: string): string {
  if (reason === 'resignation') {
    if (result === 'win') {
      return 'Your opponent resigned the game.'
    }
    return 'You resigned the game.'
  } else if (reason === 'draw_agreement') {
    return 'Draw agreed by both players.'
  } else if (reason === 'player_left') {
    if (result === 'win') {
      return 'Your opponent left the game.'
    }
    return 'You left the game.'
  }

  switch (result) {
    case 'win':
      return 'Congratulations! Well played.'
    case 'loss':
      return 'Better luck next time!'
    default:
      return 'The game ended in a draw.'
  }
}

function handleResignation(peer: any, data: any) {
  const player = playerConnections.get(peer.id)
  if (!player) return

  const gamePlayers = gameConnections.get(player.matchId)
  if (!gamePlayers) return

  const reason = data.reason || 'resignation'
  
  // Notify the resigning player
  try {
    peer.send(JSON.stringify({
      type: 'game_ended',
      result: 'You Lose',
      message: getResultDescription('loss', reason),
      playerResult: 'loss'
    }))
  } catch (error) {
    console.error('Failed to send resignation confirmation:', error)
  }

  // Notify opponent about resignation
  const opponent = gamePlayers.find(p => p.id !== peer.id)
  if (opponent) {
    try {
      opponent.ws.send(JSON.stringify({
        type: 'game_ended',
        result: 'You Win!',
        message: getResultDescription('win', reason),
        playerResult: 'win'
      }))
    } catch (error) {
      console.error('Failed to notify opponent of resignation:', error)
    }
  }

  console.log(`Player in game ${player.matchId} resigned`)
}

function handleDrawOffer(peer: any, data: any) {
  const player = playerConnections.get(peer.id)
  if (!player) return

  const gamePlayers = gameConnections.get(player.matchId)
  if (!gamePlayers) return

  // Send draw offer to opponent
  const opponent = gamePlayers.find(p => p.id !== peer.id)
  if (opponent) {
    try {
      opponent.ws.send(JSON.stringify({
        type: 'draw_offered'
      }))
    } catch (error) {
      console.error('Failed to send draw offer:', error)
    }
  }

  console.log(`Player in game ${player.matchId} offered a draw`)
}

function handleDrawResponse(peer: any, data: any) {
  const player = playerConnections.get(peer.id)
  if (!player) return

  const gamePlayers = gameConnections.get(player.matchId)
  if (!gamePlayers) return

  const opponent = gamePlayers.find(p => p.id !== peer.id)
  
  if (data.accepted) {
    // Draw accepted - notify both players
    try {
      peer.send(JSON.stringify({
        type: 'game_ended',
        result: 'Draw',
        message: getResultDescription('draw', 'draw_agreement'),
        playerResult: 'draw'
      }))
      
      if (opponent) {
        opponent.ws.send(JSON.stringify({
          type: 'game_ended',
          result: 'Draw',
          message: getResultDescription('draw', 'draw_agreement'),
          playerResult: 'draw'
        }))
      }
      
      console.log(`Draw agreed in game ${player.matchId}`)
    } catch (error) {
      console.error('Failed to process draw agreement:', error)
    }
  } else {
    // Draw declined - notify the offerer
    if (opponent) {
      try {
        opponent.ws.send(JSON.stringify({
          type: 'draw_declined'
        }))
      } catch (error) {
        console.error('Failed to send draw decline notification:', error)
      }
    }
    
    console.log(`Draw declined in game ${player.matchId}`)
  }
}