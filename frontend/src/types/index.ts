// ============================================================
// Player Types
// ============================================================
export interface Player {
  id: string;
  nickname: string;
  avatar: string;
  money: number;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  cards: AuctionCard[];
  totalSpent: number;
}

// ============================================================
// Room Types
// ============================================================
export interface RoomSettings {
  startingMoney: number;
  timerDuration: number;
  maxPlayers: number;
  numberOfCards: number;
}

export interface Room {
  code: string;
  settings: RoomSettings;
  players: Player[];
  status: RoomStatus;
  hostId: string;
  currentRound: number;
  totalRounds: number;
}

export type RoomStatus = 'waiting' | 'playing' | 'finished';

// ============================================================
// Auction Card Types
// ============================================================
export type CardCategory = 'Platinum' | 'Gold' | 'Silver' | 'Bronze';

export interface AuctionCard {
  id: string;
  name: string;
  image: string;
  category: CardCategory;
  basePrice: number;
  rating?: number;
  age?: number;
  description?: string;
}

export interface AuctionTimerState {
  timeRemaining: number;
  timerEndsAt?: number;
  timerGeneration?: number;
}

// ============================================================
// Bid Types
// ============================================================
export interface Bid {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
  timestamp: number;
}

export interface AuctionState {
  currentCard: AuctionCard | null;
  currentBid: number;
  highestBidderId: string | null;
  highestBidderName: string | null;
  bids: Bid[];
  timeRemaining: number;
  timerEndsAt?: number;
  timerGeneration?: number;
  isActive: boolean;
  isPaused?: boolean;
  currentRound: number;
  totalRounds: number;
  passedPlayers: string[];
  soldCards: SoldCard[];
  unsoldCards: AuctionCard[];
}

export interface SoldCard {
  card: AuctionCard;
  buyerId: string;
  buyerName: string;
  soldPrice: number;
}

// ============================================================
// Chat Types
// ============================================================
export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  type: 'message' | 'system';
}

// ============================================================
// Socket Event Types
// ============================================================
export interface ServerToClientEvents {
  'room:created': (data: { room: Room; playerId: string }) => void;
  'room:joined': (data: { room: Room; playerId: string }) => void;
  'room:updated': (data: { room: Room }) => void;
  'room:player-joined': (data: { player: Player }) => void;
  'room:player-left': (data: { playerId: string }) => void;
  'room:player-kicked': (data: { playerId: string }) => void;
  'room:error': (data: { message: string }) => void;
  'room:rejoined': (data: {
    success: boolean;
    room: Room;
    playerId: string;
    auction: AuctionState | null;
    timer?: AuctionTimerState | null;
    message?: string;
  }) => void;

  'game:started': (data: { room: Room; auction: AuctionState }) => void;
  'game:ended': (data: { room: Room; results: GameResults }) => void;
  'game:reset': (data: { room: Room }) => void;

  'auction:new-card': (data: {
    card: AuctionCard;
    round: number;
    totalRounds: number;
    timer?: AuctionTimerState;
  }) => void;
  'auction:player-passed': (data: { playerId: string }) => void;
  'auction:timer-update': (data: AuctionTimerState) => void;
  'auction:bid-placed': (data: {
    bid: Bid;
    currentBid: number;
    highestBidderId: string;
    highestBidderName: string;
    timeRemaining?: number;
    timerEndsAt?: number;
    timerGeneration?: number;
  }) => void;
  'auction:card-sold': (data: { soldCard: SoldCard }) => void;
  'auction:card-unsold': (data: { card: AuctionCard }) => void;
  'auction:update': (data: { auction: AuctionState }) => void;
  'auction:paused': (data: { timeRemaining: number }) => void;
  'auction:resumed': (data: { timer: AuctionTimerState }) => void;
  'auction:sync': (data: {
    success: boolean;
    room: Room;
    auction: AuctionState | null;
    timer?: AuctionTimerState | null;
    results?: GameResults | null;
    message?: string;
  }) => void;

  'chat:message': (data: ChatMessage) => void;

  'connection:status': (data: { status: 'connected' | 'disconnected' | 'reconnecting' }) => void;
}

export interface ClientToServerEvents {
  'room:create': (data: { settings: RoomSettings; nickname: string }) => void;
  'room:join': (data: { code: string; nickname: string }) => void;
  'room:leave': (data: { code: string }) => void;
  'room:ready': (data: { code: string; isReady: boolean }) => void;
  'room:kick': (data: { code: string; playerId: string }) => void;
  'room:start': (data: { code: string }) => void;

  'room:rejoin': (
    data: { code: string; nickname: string; previousPlayerId: string },
    callback?: (res: RejoinAck) => void
  ) => void;
  'auction:bid': (
    data: { code: string; amount: number },
    callback?: (res: BidAck) => void
  ) => void;
  'auction:pass': (
    data: { code: string },
    callback?: (res: PassAck) => void
  ) => void;
  'auction:sync': (
    data: { code: string },
    callback?: (res: SyncAck) => void
  ) => void;
  'auction:host-end': (data: { code: string }, callback?: (res: { success: boolean; message?: string }) => void) => void;
  'auction:host-skip': (data: { code: string }, callback?: (res: { success: boolean; message?: string }) => void) => void;
  'auction:host-pause': (data: { code: string }, callback?: (res: { success: boolean; message?: string }) => void) => void;
  'auction:host-resume': (data: { code: string }, callback?: (res: { success: boolean; message?: string }) => void) => void;
  'game:restart': (data: { code: string }, callback?: (res: { success: boolean; message?: string }) => void) => void;

  'chat:send': (data: { code: string; message: string }) => void;
}

// ============================================================
// Game Results
// ============================================================
export interface PlayerResult {
  player: Player;
  rank: number;
  cardsOwned: number;
  totalSpent: number;
  remainingMoney: number;
  mostExpensivePurchase: SoldCard | null;
  score: number;
}

export interface GameResults {
  playerResults: PlayerResult[];
  unsoldCards: AuctionCard[];
  totalRounds: number;
}

// ============================================================
// UI State Types
// ============================================================
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface BidAck {
  success: boolean;
  message?: string;
  currentBid?: number;
  timer?: AuctionTimerState;
}

export interface PassAck {
  success: boolean;
  message?: string;
  resolved?: boolean;
}

export interface RejoinAck {
  success: boolean;
  message?: string;
  room?: Room;
  playerId?: string;
  auction?: AuctionState | null;
  timer?: AuctionTimerState | null;
}

export interface SyncAck {
  success: boolean;
  message?: string;
  room?: Room;
  auction?: AuctionState | null;
  timer?: AuctionTimerState | null;
  results?: GameResults | null;
}
