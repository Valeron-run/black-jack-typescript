//Масти и номиналы
import type { Card, Suit, Rank} from "./types";

//Массив рангов карт
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

//Фукнция генерации калоды карт из 52 элементов
function generationCard(): Card[] {
    try{
        //Массив из карт
        const cards: Card[] = [];
        //Количество кард
        const cardCost: number = 52;

        for(let rank of RANKS){

            let cardValue = parseInt(rank);

            if(['J', 'Q', 'K'].includes(rank)){
                cardValue = 10;
            } else if (rank === "A"){
                cardValue = 11;
            }

            const suitH: Suit =  "Hearts";
            const suitD: Suit =  "Diamonds";
            const suitC: Suit =  "Clubs";
            const suitS: Suit =  "Spades";
            cards.push({
                suit: suitH,
                rank: rank,
                value: cardValue,
            });
            cards.push({
                suit: suitD,
                rank: rank,
                value: cardValue,
            });
            cards.push({
                suit: suitC,
                rank: rank,
                value: cardValue,
            });
            cards.push({
                suit: suitS,
                rank: rank,
                value: cardValue,
            });
        }

        //Проверка на кол-во кард
        if(cards.length != 52){
            throw new Error(`[GameLogicError] Неправильная инициализация карт. Ожидалось 52, получено ${cards.length}`);
        }

        //Возвращаем результирующий массив с картами
        return cards;
    } catch(err){
        console.log(`[GameLogicError] ошибка при генерации кард ${err}`);
        throw err;
    }
}

//Алгоритм тасования карт Фишера-Йетса
function fisherYates(cards: Card[]): Card[]{
    //Копируем карты для безопасности 
    const cardsCopy: Card[] = structuredClone(cards);

    for(let i = cardsCopy.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        const temp = cardsCopy[i]!;
        cardsCopy[i] = cardsCopy[j]!;
        cardsCopy[j] = temp;
    }

    return cardsCopy;
}
export {fisherYates, generationCard};
const myDesk = generationCard();
//console.log("Количество кард: " + myDesk.length);
//console.log("Верхняя карта колоды:", myDesk[myDesk.length - 1]);
//const refreshCard =  fisherYates(myDesk);
//console.log("Верхняя карта колоды перемешанной:", refreshCard[refreshCard.length - 1]);