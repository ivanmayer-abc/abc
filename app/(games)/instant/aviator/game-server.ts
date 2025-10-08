// Server-side game logic that runs independently of clients

class AviatorGameServer {
  private crashPoint: number | null = null;
  private multiplier: number = 1.0;
  private isRunning: boolean = false;
  private gameState: 'waiting' | 'countdown' | 'running' | 'crashed' = 'waiting';
  private gameHistory: number[] = [];
  private startTime: number = 0;
  private intervalId: NodeJS.Timeout | null = null;
  
  // Demo players with auto-bet behavior
  private demoPlayers = [
    { id: 1, name: "Player 1", balance: 5000, betAmount: 100, cashOutAt: 2.5 },
    { id: 2, name: "Player 2", balance: 8000, betAmount: 200, cashOutAt: 1.8 },
    { id: 3, name: "Player 3", balance: 3000, betAmount: 50, cashOutAt: 5.0 },
    { id: 4, name: "Player 4", balance: 10000, betAmount: 500, cashOutAt: 3.2 },
  ];

  private playerBets: Array<{
    playerId: number;
    amount: number;
    cashedOut: boolean;
    cashoutMultiplier: number;
    playerName: string;
  }> = [];

  // Store the last broadcast time to limit update frequency
  private lastBroadcastTime: number = 0;
  private broadcastInterval: number = 50; // Broadcast every 50ms

  constructor() {
    this.startGameLoop();
  }
  
  private generateCrashMultiplier(): number {
    const rand = Math.random();
    if (rand < 0.001) return 1.0; // 0.1% chance of instant crash
    if (rand < 0.01) return parseFloat((1 + Math.random() * 2).toFixed(2)); // 0.9% chance of low multiplier
    return Math.max(1.01, parseFloat((1.0 / (1.0 - rand)).toFixed(2)));
  }
  
  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  // Method to broadcast game state to potential clients
  private broadcastState() {
    const now = Date.now();
    if (now - this.lastBroadcastTime < this.broadcastInterval) {
      return;
    }
    
    this.lastBroadcastTime = now;
    
    // In a real implementation, you would send this to connected clients
    // For now, we'll just update the state internally
  }
  
  private startGameLoop() {
    // Start a new game every 3-5 seconds (reduced from 5-8 seconds)
    const startNextGame = () => {
      if (this.gameState === 'waiting') {
        this.startCountdown();
      }
      
      const nextGameDelay = 3000 + Math.random() * 2000; // Reduced wait time
      setTimeout(startNextGame, nextGameDelay);
    };
    
    startNextGame();
  }
  
  private startCountdown() {
    this.gameState = 'countdown';
    this.crashPoint = null;
    this.multiplier = 1.0;
    this.playerBets = [];
    this.broadcastState();
    
    // Demo players place bets
    this.placeDemoBets();
    
    // Start game after countdown
    setTimeout(() => {
      this.startGame();
    }, 3000);
  }
  
  private placeDemoBets() {
    this.demoPlayers.forEach(player => {
      if (player.balance >= player.betAmount && Math.random() > 0.3) { // 70% chance to bet
        this.playerBets.push({
          playerId: player.id,
          playerName: player.name,
          amount: player.betAmount,
          cashedOut: false,
          cashoutMultiplier: 1.0
        });
        player.balance -= player.betAmount;
      }
    });
    this.broadcastState();
  }
  
  private processDemoCashOuts() {
    this.playerBets.forEach(bet => {
      if (!bet.cashedOut) {
        const player = this.demoPlayers.find(p => p.id === bet.playerId);
        if (player && this.multiplier >= player.cashOutAt && Math.random() > 0.2) { // 80% chance to cash out
          const winnings = Math.floor(bet.amount * this.multiplier);
          player.balance += winnings;
          bet.cashedOut = true;
          bet.cashoutMultiplier = this.multiplier;
        }
      }
    });
  }
  
  private startGame() {
    this.crashPoint = this.generateCrashMultiplier();
    this.multiplier = 1.0;
    this.isRunning = true;
    this.gameState = 'running';
    this.startTime = Date.now();
    this.broadcastState();
    
    // Game loop running on the server
    this.intervalId = setInterval(() => {
      if (!this.isRunning) {
        if (this.intervalId) clearInterval(this.intervalId);
        return;
      }
      
      const elapsed = (Date.now() - this.startTime) / 1000;
      
      // Calculate multiplier progression with smoother curve
      let baseMultiplier;
      if (elapsed < 3) { // Reduced from 5 seconds
        // Slow start phase
        baseMultiplier = 1 + this.easeOutQuad(elapsed / 3) * 2;
      } else if (elapsed < 6) { // Reduced from 10 seconds
        // Acceleration phase
        const adjustedElapsed = elapsed - 3;
        baseMultiplier = 3 + this.easeOutQuad(adjustedElapsed / 3) * 7;
      } else {
        // Fast growth phase
        const adjustedElapsed = elapsed - 6;
        baseMultiplier = 10 + Math.pow(adjustedElapsed / 3, 1.5) * 20;
      }
      
      this.multiplier = parseFloat(Math.max(1.0, baseMultiplier).toFixed(2));
      
      // Demo players cash out automatically
      this.processDemoCashOuts();
      
      // Broadcast state for smooth client updates
      this.broadcastState();
      
      // Check if crashed
      if (this.crashPoint && this.multiplier >= this.crashPoint) {
        this.multiplier = this.crashPoint;
        this.isRunning = false;
        this.gameState = 'crashed';
        
        // Add to game history
        this.gameHistory.unshift(this.crashPoint);
        if (this.gameHistory.length > 5) {
          this.gameHistory.pop();
        }
        
        this.broadcastState();
        
        // Move back to waiting state after crash
        setTimeout(() => {
          this.gameState = 'waiting';
          this.broadcastState();
        }, 3000);
        
        if (this.intervalId) clearInterval(this.intervalId);
      }
    }, 50); // Update every 50ms for smoother animation
  }
  
  public getGameState() {
    return {
      multiplier: this.multiplier,
      crashPoint: this.crashPoint,
      isRunning: this.isRunning,
      gameState: this.gameState,
      gameHistory: [...this.gameHistory],
      playerBets: [...this.playerBets],
      demoPlayers: this.demoPlayers.map(p => ({ ...p })), // Return copies
      elapsedTime: this.isRunning ? (Date.now() - this.startTime) / 1000 : 0,
      timestamp: Date.now() // Add timestamp for client-side animation
    };
  }
}

// Create a single instance for the server
const gameServer = new AviatorGameServer();

export default gameServer;