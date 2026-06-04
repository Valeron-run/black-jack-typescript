import { GameSession, AmericanRules } from './game';
import type { Card } from './types'; 

describe('Blackjack GameSession Logic', () => {

    it('Должен корректно обрабатывать SPLIT (Разделение рук)', () => {
        const riggedDeck: Card[] = [
            { suit: 'Spades', rank: '9', value: 9 },   // Карта на вторую руку
            { suit: 'Hearts', rank: '10', value: 10 }, // Карта на первую руку
            { suit: 'Clubs', rank: '5', value: 5 },    // Карта дилеру
            { suit: 'Diamonds', rank: '8', value: 8 }, // Игроку: 8 (ПАРА!)
            { suit: 'Spades', rank: '10', value: 10 }, // Карта дилеру
            { suit: 'Hearts', rank: '8', value: 8 }    // Игроку: 8 
        ];

        const game = new GameSession(AmericanRules);
        
        // МАГИЯ ТЕСТОВ: Напрямую перезаписываем приватную колоду нашей крапленой!
        (game as any).deck = riggedDeck;
        
        // Теперь при старте игры она возьмет карты из нашей колоды
        game.bid(100); 

        let state = game.getState();
        
        // Проверяем, что раздача прошла по нашему плану
        expect(state.player.hands[0].cards.map(c => c.rank)).toEqual(['8', '8']);
        expect(state.player.hands.length).toBe(1);

        // Делаем сплит
        game.split();

        state = game.getState();
        // Проверяем, что руки разделились и ставки списались
        expect(state.player.hands.length).toBe(2);
        expect(state.player.money).toBe(9800); // 10000 - 100(первая) - 100(сплит)
        expect(state.player.hands[0].cards.map(c => c.rank)).toEqual(['8', '10']);
        expect(state.player.hands[1].cards.map(c => c.rank)).toEqual(['8', '9']);
    });

    it('Должен запрещать SPLIT на разных картах', () => {
        const riggedDeck: Card[] = [
            { suit: 'Clubs', rank: '5', value: 5 },
            { suit: 'Diamonds', rank: '9', value: 9 }, // Игроку: 9
            { suit: 'Spades', rank: '10', value: 10 },
            { suit: 'Hearts', rank: '8', value: 8 }    // Игроку: 8
        ];
        
        const game = new GameSession(AmericanRules);
        
        // Подменяем колоду
        (game as any).deck = riggedDeck;
        
        game.bid(100);

        // Теперь игрок 100% получил 8 и 9. Сплит должен выдать ошибку.
        expect(() => game.split()).toThrow("Сплит возможен только при двух одинаковых картах!");
    });
});