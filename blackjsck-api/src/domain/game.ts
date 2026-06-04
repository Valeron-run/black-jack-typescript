import { generationCard, fisherYates } from './cardCreation';
import type { Card } from './types';

// Интерфейс правил игры
export interface BlackjackRuleSet {
    name: string;
    blackjackPayout: number;
    allowSurrender: boolean;
    allowDouble: boolean;
    stopAfterAceSplit: boolean; // Ограничение на 1 карту при сплите Тузов
}

export const AmericanRules: BlackjackRuleSet = {
    name: 'American',
    blackjackPayout: 1.5,  // 3:2 7:6
    allowSurrender: true,
    allowDouble: true,
    stopAfterAceSplit: true,
};


//Вспомогательная функция
function calculatePoints(hand: Card[]): number {
    let points = 0;
    let aces = 0;
    for (const card of hand) {
        points += card.value;
        if (card.rank === 'A') aces += 1;
    }
    while (points > 21 && aces > 0) {
        points -= 10;
        aces -= 1;
    }
    return points;
}

//Сущности в игре
class PlayerHand {
    constructor(
        public cards: Card[] = [],
        public bet: number = 0,
        public isFinished: boolean = false
    ) {}
    public getPoints() { return calculatePoints(this.cards); }
}

class Player {
    public money: number = 10000;
    public hands: PlayerHand[] = [];
    public activeHandIndex: number = 0; // Какая рука сейчас играет

    public placeBid(amount: number) {
        if (amount > this.money) throw new Error("Недостаточно средств!");
        this.money -= amount;
        this.hands = [new PlayerHand([], amount)];
        this.activeHandIndex = 0;
    }
    public clearHands() { this.hands = []; }
}

class Dealer {
    public hand: Card[] = [];
    public receiveCard(card: Card) { this.hand.push(card); }
    public getPoints() { return calculatePoints(this.hand); }
    public clearHand() { this.hand = []; }
}

// Игровая сессия(аркестратор самой игры)
export class GameSession {
    private deck: Card[];
    private player: Player;
    private dealer: Dealer;
    private status: 'betting' | 'playing' | 'dealer_turn' | 'resolved' = 'betting';
    private rules: BlackjackRuleSet;

    constructor(rules: BlackjackRuleSet = AmericanRules) {
        this.deck = fisherYates(generationCard());
        this.player = new Player();
        this.dealer = new Dealer();
        this.rules = rules;
    }

    public bid(amount: number) {
        if (this.status !== 'betting' && this.status !== 'resolved') {
            throw new Error("Ставки уже сделаны или игра идет!");
        }

        this.dealer.clearHand();
        this.player.clearHands();
        
        this.status = 'betting'; 
        this.player.placeBid(amount);
        this.startGame();
    }

    public hit() {
        if (this.status !== 'playing') throw new Error("Сейчас нельзя брать карту!");
        const hand = this.player.hands[this.player.activeHandIndex];
        
        hand.cards.push(this.drawCard());
        if (hand.getPoints() > 21) {
            hand.isFinished = true;
            this.advanceHand();
        }
    }

    public stand() {
        if (this.status !== 'playing') throw new Error("Неверный статус!");
        this.player.hands[this.player.activeHandIndex].isFinished = true;
        this.advanceHand();
    }

    public double() {
        if (this.status !== 'playing' || !this.rules.allowDouble) throw new Error("Double недоступен!");
        const hand = this.player.hands[this.player.activeHandIndex];
        if (hand.cards.length !== 2) throw new Error("Double только на первых двух картах!");
        if (this.player.money < hand.bet) throw new Error("Недостаточно средств для удвоения!");

        this.player.money -= hand.bet;
        hand.bet *= 2;
        hand.cards.push(this.drawCard());
        hand.isFinished = true;
        
        this.advanceHand();
    }

    public surrender() {
        if (this.status !== 'playing' || !this.rules.allowSurrender) throw new Error("Surrender недоступен!");
        if (this.player.hands.length > 1 || this.player.hands[0].cards.length !== 2) {
            throw new Error("Сдаться можно только первым ходом без сплитов!");
        }

        const hand = this.player.hands[0];
        this.player.money += hand.bet / 2;
        hand.bet = 0;
        
        this.status = 'resolved';
        if (this.deck.length < 20) this.deck = fisherYates(generationCard());
    }

    public split() {
        if (this.status !== 'playing') throw new Error("Неверный статус!");
        const hand = this.player.hands[this.player.activeHandIndex];
        
        if (hand.cards.length !== 2 || hand.cards[0].rank !== hand.cards[1].rank) {
            throw new Error("Сплит возможен только при двух одинаковых картах!");
        }
        if (this.player.money < hand.bet) throw new Error("Недостаточно денег для сплита!");

        this.player.money -= hand.bet;
        const splitCard = hand.cards.pop()!;
        const newHand = new PlayerHand([splitCard], hand.bet);
        
        hand.cards.push(this.drawCard());
        newHand.cards.push(this.drawCard());

        this.player.hands.splice(this.player.activeHandIndex + 1, 0, newHand);

        // Правило: если сплитнули Тузы, даем только 1 карту и завершаем ход
        if (hand.cards[0].rank === 'A' && this.rules.stopAfterAceSplit) {
            hand.isFinished = true;
            newHand.isFinished = true;
            this.advanceHand();
            if (this.status === 'playing') this.advanceHand(); 
        }
    }


    private advanceHand() {
        this.player.activeHandIndex++;
        if (this.player.activeHandIndex >= this.player.hands.length) {
            this.status = 'dealer_turn';
            this.dealerTurn();
        }
    }

    private startGame() {
        this.player.hands[0].cards.push(this.drawCard());
        this.dealer.receiveCard(this.drawCard());
        this.player.hands[0].cards.push(this.drawCard());
        this.dealer.receiveCard(this.drawCard());

        this.status = 'playing';
        this.checkInitialBlackjack();
    }

    private checkInitialBlackjack() {
        const hand = this.player.hands[0];
        if (hand.getPoints() === 21) {
            if (this.dealer.getPoints() === 21) {
                this.player.money += hand.bet; // Ничья
            } else {
                this.player.money += hand.bet + (hand.bet * this.rules.blackjackPayout); // Блэкджек
            }
            this.status = 'resolved';
            if (this.deck.length < 20) this.deck = fisherYates(generationCard());
        }
    }

    private dealerTurn() {
        const allBusted = this.player.hands.every(h => h.getPoints() > 21);
        if (!allBusted) {
            while (this.dealer.getPoints() < 17) {
                this.dealer.receiveCard(this.drawCard());
            }
        }
        this.resolveGame();
    }

    private resolveGame() {
        this.status = 'resolved';
        const dealerPoints = this.dealer.getPoints();
        const dealerBusted = dealerPoints > 21;

        for (const hand of this.player.hands) {
            const pPoints = hand.getPoints();
            if (pPoints > 21) continue; 

            if (dealerBusted || pPoints > dealerPoints) {
                this.player.money += hand.bet * 2; 
            } else if (pPoints === dealerPoints) {
                this.player.money += hand.bet; 
            }
        }
        
        if (this.deck.length < 20) this.deck = fisherYates(generationCard());
    }

    private drawCard(): Card {
        return this.deck.pop() || { suit: 'Spades', rank: '2', value: 2 }; 
    }

    // Для субд(обновляем динамически состояния игры)
    public getState() {
        return {
            status: this.status,
            ruleset: this.rules.name,
            player: {
                money: this.player.money,
                hands: this.player.hands.map((h, index) => ({
                    cards: h.cards,
                    points: h.getPoints(),
                    bet: h.bet,
                    isActive: index === this.player.activeHandIndex && this.status === 'playing'
                }))
            },
            dealer: {
                points: this.dealer.getPoints(),
                cards: this.dealer.hand
            }
        };
    }

    public exportData() {
        return {
            status: this.status,
            deck: this.deck,
            player: {
                money: this.player.money,
                hands: this.player.hands,
                activeHandIndex: this.player.activeHandIndex
            },
            dealer: { hand: this.dealer.hand }
        };
    }

    public importData(data: any) {
        this.status = data.status;
        this.deck = data.deck;
        this.player.money = data.player?.money || 10000;
        

        if (data.player?.hands) {
            this.player.hands = data.player.hands.map((h: any) => new PlayerHand(h.cards, h.bet, h.isFinished));
            this.player.activeHandIndex = data.player.activeHandIndex;
        } else if (data.player?.hand) {
            // Если игра из старой БД с одной рукой, оборачиваем ее в массив
            this.player.hands = [new PlayerHand(data.player.hand, data.player.currentBet || 0, false)];
            this.player.activeHandIndex = 0;
        } else {
            this.player.hands = [];
        }
        
        this.dealer.hand = data.dealer?.hand || [];
    }
}
