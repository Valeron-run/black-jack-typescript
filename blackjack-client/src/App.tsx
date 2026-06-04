import { useState } from 'react';
import axios from 'axios';
import './App.css';

const api = axios.create({ baseURL: 'http://localhost:3000/api/rooms' });
const suitSymbols: Record<string, string> = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };

const statusDict: Record<string, string> = {
  betting: 'ОЖИДАНИЕ СТАВКИ',
  playing: 'ВАШ ХОД',
  dealer_turn: 'ХОД ДИЛЕРА',
  resolved: 'РАУНД ЗАВЕРШЕН'
};

function App() {
  const [roomId, setRoomId] = useState<string>('table-1');
  const [betAmount, setBetAmount] = useState<number>(100);
  const [logs, setLogs] = useState<string[]>([]);
  const [showRules, setShowRules] = useState(true);
  const [gameState, setGameState] = useState<any>(null);

  const addLog = (message: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  const checkGameResolution = (state: any) => {
    if (state.status === 'resolved') {
        const dPts = state.dealer.points;
        const dealerMsg = dPts > 21 ? '(Дилер перебрал)' : `(Дилер: ${dPts})`;
        
        addLog(`=== РАУНД ЗАВЕРШЕН ${dealerMsg} ===`);
        
        // Пишем результат по каждой руке (полезно при сплите)
        state.player.hands.forEach((hand: any, index: number) => {
             const handName = state.player.hands.length > 1 ? `Рука ${index + 1}: ` : '';
             if (hand.points > 21) addLog(`${handName}💀 ПЕРЕБОР (${hand.points} очк.)`);
             else if (dPts > 21 || hand.points > dPts) addLog(`${handName}🏆 ПОБЕДА (${hand.points} очк.)`);
             else if (hand.points < dPts) addLog(`${handName}💀 ПОРАЖЕНИЕ (${hand.points} очк.)`);
             else addLog(`${handName}🤝 НИЧЬЯ`);
        });

        if (state.player.money <= 0) addLog("💸 ВЫ БАНКРОТ! У вас 0$.");
    }
  };

  const handleCreateRoom = async () => {
    try {
      const res = await api.post(`/${roomId}/create`);
      addLog(res.data.message);
      setGameState(res.data.state);
    } catch (err: any) { addLog(`🔴 Ошибка: ${err.response?.data?.message || err.message}`); }
  };

  const handleBid = async () => {
    try {
      const res = await api.post(`/${roomId}/bid`, { amount: betAmount });
      addLog(`💰 Ставка $${betAmount} принята.`);
      setGameState(res.data.state);
      checkGameResolution(res.data.state);
    } catch (err: any) { addLog(`🔴 Ошибка: ${err.response?.data?.message || err.message}`); }
  };

  const handleAction = async (action: string) => {
    try {
      const res = await api.post(`/${roomId}/action`, { action });
      addLog(`🃏 Вы выбрали: ${action.toUpperCase()}`);
      setGameState(res.data.state);
      checkGameResolution(res.data.state);
    } catch (err: any) { addLog(`🔴 Ошибка: ${err.response?.data?.message || err.message}`); }
  };

  const renderCards = (cards: any[]) => {
    if (!cards || cards.length === 0) return <span className="empty-cards">Нет карт</span>;
    return cards.map((c, i) => {
      const isRed = c.suit === 'Hearts' || c.suit === 'Diamonds';
      return (
        <span key={i} className={`card ${isRed ? 'text-red' : 'text-black'}`}>
          {c.rank} {suitSymbols[c.suit]}
        </span>
      );
    });
  };

  const isBankrupt = gameState?.player?.money <= 0;
  const isPlaying = gameState?.status === 'playing';
  
  // Ищем активную руку для проверок кнопок
  const activeHand = gameState?.player?.hands?.find((h: any) => h.isActive) || gameState?.player?.hands?.[0];
  const isInitialTwoCards = activeHand?.cards?.length === 2;
  const canSplit = isInitialTwoCards && activeHand.cards[0].rank === activeHand.cards[1].rank && gameState.player.hands.length === 1; // Запрещаем двойной сплит для простоты
  const isFirstMove = isInitialTwoCards && gameState.player.hands.length === 1;

  return (
    <div className="container">
      {showRules && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>📜 Правила Блэкджека (Американский)</h2>
            <ul>
              <li>Цель: набрать больше очков, чем у дилера, но не более <b>21</b>.</li>
              <li><b>Hit (Еще):</b> Взять дополнительную карту.</li>
              <li><b>Stand (Хватит):</b> Передать ход дилеру.</li>
              <li><b>Double:</b> Удвоить ставку на первых двух картах. Выдается 1 карта.</li>
              <li><b>Surrender:</b> Сдаться на первых двух картах, вернув 50% ставки.</li>
              <li><b>Split:</b> При 2 одинаковых картах разделить их на две независимые руки.</li>
            </ul>
            <button className="btn-success" onClick={() => setShowRules(false)}>Начать игру!</button>
          </div>
        </div>
      )}

      <header className="header-top">
        <h1>Blackjack API Console</h1>
        <div className={`balance-badge ${isBankrupt ? 'bankrupt-badge' : ''}`}>
          Баланс: ${gameState ? gameState.player.money : 10000}
        </div>
      </header>

      <div className="dashboard">
        <div className="controls">
          <div className="control-group">
            <label>ID Комнаты:</label>
            <input type="text" value={roomId} onChange={(e) => setRoomId(e.target.value)} />
            <button onClick={handleCreateRoom} className="btn-primary">Зайти за стол</button>
          </div>

          <div className="control-group">
            <label>Сумма ставки ($):</label>
            <input type="number" value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} min="10" />
            <button onClick={handleBid} className="btn-warning" disabled={isPlaying || isBankrupt}>
              Сделать ставку
            </button>
          </div>

          <div className="control-group actions">
            <p>Действия игрока:</p>
            <div className="btn-row">
              <button onClick={() => handleAction('hit')} className="btn-success" disabled={!isPlaying}>Hit</button>
              <button onClick={() => handleAction('stand')} className="btn-danger" disabled={!isPlaying}>Stand</button>
            </div>
            
            {/* СПЕЦИАЛЬНЫЕ ДЕЙСТВИЯ */}
            {isPlaying && isInitialTwoCards && (
                <div className="btn-row" style={{ marginTop: '0.8rem' }}>
                  <button onClick={() => handleAction('double')} className="btn-warning">Double</button>
                  {isFirstMove && <button onClick={() => handleAction('surrender')} className="btn-primary" style={{ background: '#64748b' }}>Surrender</button>}
                  {canSplit && <button onClick={() => handleAction('split')} className="btn-primary" style={{ background: '#8b5cf6' }}>Split</button>}
                </div>
            )}
          </div>
        </div>

        <div className="game-table">
          <h3>Статус: {gameState ? statusDict[gameState.status] : statusDict['betting']}</h3>
          
          <div className="participant dealer-zone">
            <h4>Дилер (Очки: {gameState?.dealer?.points || 0})</h4>
            <div className="cards-container">{gameState ? renderCards(gameState.dealer.cards) : '...'}</div>
          </div>

          <div className="participant player-zone">
            <h4>Ваши Руки:</h4>
            {/* Отрисовываем каждую руку отдельно. Подсвечиваем активную при Сплите */}
            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                {gameState?.player?.hands ? gameState.player.hands.map((hand: any, idx: number) => (
                    <div key={idx} style={{ padding: '1rem', border: hand.isActive ? '2px solid #22c55e' : '1px solid #334155', borderRadius: '8px', background: hand.isActive ? '#064e3b' : 'transparent' }}>
                        <div>Очки: <b>{hand.points}</b> | Ставка: ${hand.bet}</div>
                        <div className="cards-container" style={{ marginTop: '0.5rem' }}>{renderCards(hand.cards)}</div>
                    </div>
                )) : '...'}
            </div>
          </div>
        </div>
      </div>

      <div className="terminal">
        <h3>Логи сервера:</h3>
        <div className="log-window">
          {logs.map((log, index) => <div key={index} className="log-entry">{log}</div>)}
        </div>
      </div>
    </div>
  );
}

export default App;