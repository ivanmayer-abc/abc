import gameServer from "./game-server";

export default async function ServerAviatorGame() {
  // Get the current game state directly from the server
  const gameState = gameServer.getGameState();
  
  // Calculate visual properties based on multiplier
  const progress = Math.min(1, (gameState.multiplier - 1) / 2);
  const rocketX = 17 + progress * 60;
  const curveX = (rocketX - 15) / 60;
  const rocketY = 85 - (60 * curveX * curveX);
  const rotation = 45 * progress;
  const rocketSize = 60 + Math.min(40, (gameState.multiplier - 1) * 10);
  
  // Countdown calculation
  let countdown = 0;
  if (gameState.gameState === 'countdown') {
    countdown = 3 - (gameState.elapsedTime || 0);
  }
  
  // Active bets
  const activeBets = gameState.playerBets.filter(bet => !bet.cashedOut);
  const totalBet = activeBets.reduce((sum, bet) => sum + bet.amount, 0);
  const potentialWin = totalBet * gameState.multiplier;
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      {/* Game display */}
      <div className="w-full max-w-4xl aspect-[3/2] bg-gradient-to-b from-blue-300 to-blue-500 border-8 border-yellow-500 rounded-xl relative overflow-hidden shadow-2xl">
        {/* Animated cloud background */}
        <div className="absolute inset-0">
          {/* Multiple animated cloud layers */}
          <div className="absolute top-10 left-10 w-32 h-16 bg-white/80 rounded-full"></div>
          <div className="absolute top-10 left-20 w-40 h-20 bg-white/90 rounded-full"></div>
          <div className="absolute top-15 left-5 w-36 h-18 bg-white/70 rounded-full"></div>
          
          <div className="absolute top-30 right-20 w-40 h-20 bg-white/80 rounded-full"></div>
          <div className="absolute top-35 right-10 w-32 h-16 bg-white/90 rounded-full"></div>
          <div className="absolute top-25 right-25 w-36 h-18 bg-white/70 rounded-full"></div>
          
          <div className="absolute top-60 left-20 w-48 h-24 bg-white/80 rounded-full"></div>
          <div className="absolute top-65 left-10 w-36 h-18 bg-white/90 rounded-full"></div>
          <div className="absolute top-55 left-30 w-40 h-20 bg-white/70 rounded-full"></div>
          
          <div className="absolute top-70 right-30 w-44 h-22 bg-white/80 rounded-full"></div>
          <div className="absolute top-75 right-15 w-32 h-16 bg-white/90 rounded-full"></div>
          <div className="absolute top-65 right-35 w-36 h-18 bg-white/70 rounded-full"></div>
        </div>

        {/* Flight path */}
        <svg width="100%" height="100%" className="absolute">
          <path
            d="M15 85 Q 45 85, 75 25"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        </svg>

        {/* Rocket */}
        <div
          className="absolute transition-all duration-75"
          style={{
            left: `${rocketX}%`,
            top: `${rocketY}%`,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            pointerEvents: 'none',
            fontSize: `${rocketSize}px`,
            zIndex: 10,
            filter: gameState.gameState === 'running' ? 'drop-shadow(0 0 8px rgba(255,255,0,0.5))' : 'none',
          }}
        >
          🚀
        </div>

        {/* Explosion effect when crashed */}
        {gameState.gameState === 'crashed' && (
          <div
            className="absolute"
            style={{
              left: `${rocketX}%`,
              top: `${rocketY}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              fontSize: `${rocketSize * 1.5}px`,
              zIndex: 20
            }}
          >
            💥
          </div>
        )}

        {/* Multiplier display */}
        <div className="absolute top-4 left-4 text-4xl font-bold text-green-400 drop-shadow-lg">
          {gameState.multiplier > 1 ? `x${gameState.multiplier.toFixed(2)}` : '—'}
        </div>

        {/* Game state indicator */}
        <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded text-sm">
          {gameState.gameState === 'waiting' && 'Waiting...'}
          {gameState.gameState === 'countdown' && `Starting in ${Math.ceil(countdown)}...`}
          {gameState.gameState === 'running' && 'Flying!'}
          {gameState.gameState === 'crashed' && `Crashed at x${gameState.crashPoint?.toFixed(2)}`}
        </div>

        {/* Game history */}
        <div className="absolute bottom-4 left-4 flex space-x-2">
          {gameState.gameHistory.map((point, index) => (
            <div 
              key={index} 
              className={`px-2 py-1 rounded text-xs font-semibold ${
                point < 2 ? 'bg-red-500' : point < 5 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
            >
              x{point.toFixed(2)}
            </div>
          ))}
        </div>

        {/* Active bets indicator */}
        {activeBets.length > 0 && (
          <div className="absolute top-12 left-4 px-3 py-1 rounded text-sm font-semibold bg-blue-800 shadow">
            Active bets: ${totalBet} (Potential: ${potentialWin.toFixed(0)})
          </div>
        )}

        {/* Countdown overlay */}
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-8xl font-bold text-white/90">
              {Math.ceil(countdown)}
            </div>
          </div>
        )}
      </div>

      {/* Game info and player list */}
      <div className="mt-8 flex flex-col space-y-4 w-full max-w-4xl">
        <div className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
          <div className="text-lg font-semibold">
            Server-Controlled Aviator Game
          </div>
          <div className="text-sm text-gray-300">
            Multiplier: {gameState.multiplier > 1 ? `x${gameState.multiplier.toFixed(2)}` : '—'}
          </div>
        </div>

        {/* Player list */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Demo Players</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {gameState.demoPlayers.map(player => (
              <div key={player.id} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                <div className="text-sm">{player.name}</div>
                <div className="text-sm font-semibold">${player.balance}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Active bets */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-400 mb-3">Active Bets</h3>
          {activeBets.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {activeBets.map(bet => (
                <div key={`${bet.playerId}-${bet.amount}`} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                  <div className="text-sm">{bet.playerName}</div>
                  <div className="text-sm font-semibold">${bet.amount}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4">No active bets</div>
          )}
        </div>

        <div className="text-gray-300 text-center">
          <p className="text-lg">Fully Server-Side Aviator Game</p>
          <p className="mt-2 text-sm">
            This game runs completely on the server with demo players. 
            The game continues automatically even if no one is watching.
          </p>
        </div>
      </div>
    </div>
  );
}