//Масти и номиналы
export type Suit = "Hearts" | "Diamonds" | "Clubs" | "Spades";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

// Интерфейс карты
export interface Card {
    suit: Suit;
    rank: Rank;
    value: number;
}

//Статус игрока в конкретной раздаче
export type PlayerStatus = "playing" | "bust" | "stand" | "blackjack" | "won" | "lost" | "push";