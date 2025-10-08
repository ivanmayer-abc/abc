// components/CompactRouletteTable.tsx
'use client';

import { useState, useCallback, useRef } from 'react';

interface Chip {
  id: string;
  value: number;
  position: { x: number; y: number };
  betType: string;
  betValue: string | number;
}

interface GameState {
  balance: number;
  currentBet: number;
  chips: Chip[];
  isSpinning: boolean;
  winningNumber: number | null;
  gameHistory: number[];
  totalBet: number;
}

const CompactRouletteTable = () => {
  const [gameState, setGameState] = useState<GameState>({
    balance: 50000,
    currentBet: 500,
    chips: [],
    isSpinning: false,
    winningNumber: null,
    gameHistory: [32, 15, 0, 19, 4, 21, 2, 25, 17, 34],
    totalBet: 0,
  });

  const tableRef = useRef<HTMLDivElement>(null);

  const chipValues = [100, 500, 1000, 2500, 5000];

  // European roulette numbers layout - правильный порядок слева направо
  const numbersLayout = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [10, 11, 12],
    [13, 14, 15],
    [16, 17, 18],
    [19, 20, 21],
    [22, 23, 24],
    [25, 26, 27],
    [28, 29, 30],
    [31, 32, 33],
    [34, 35, 36]
  ];

  const getNumberColor = (num: number): string => {
    if (num === 0) return 'bg-emerald-600 hover:bg-emerald-500';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(num) 
      ? 'bg-rose-600 hover:bg-rose-500' 
      : 'bg-gray-900 hover:bg-gray-800';
  };

  const placeChip = useCallback((betType: string, betValue: string | number, clientX: number, clientY: number) => {
    if (gameState.currentBet > gameState.balance || gameState.isSpinning) return;
    if (!tableRef.current) return;

    const tableRect = tableRef.current.getBoundingClientRect();
    const x = ((clientX - tableRect.left) / tableRect.width) * 100;
    const y = ((clientY - tableRect.top) / tableRect.height) * 100;

    const newChip: Chip = {
      id: Math.random().toString(36).substr(2, 9),
      value: gameState.currentBet,
      position: { x, y },
      betType,
      betValue
    };

    setGameState(prev => ({
      ...prev,
      balance: prev.balance - prev.currentBet,
      chips: [...prev.chips, newChip],
      totalBet: prev.totalBet + prev.currentBet
    }));
  }, [gameState.currentBet, gameState.balance, gameState.isSpinning]);

  const clearBets = useCallback(() => {
    const totalBetAmount = gameState.chips.reduce((sum, chip) => sum + chip.value, 0);
    setGameState(prev => ({
      ...prev,
      balance: prev.balance + totalBetAmount,
      chips: [],
      totalBet: 0
    }));
  }, [gameState.chips]);

  const spinWheel = useCallback(async () => {
    if (gameState.chips.length === 0 || gameState.isSpinning) return;

    setGameState(prev => ({ ...prev, isSpinning: true }));

    await new Promise(resolve => setTimeout(resolve, 3000));

    const winningNum = Math.floor(Math.random() * 37);
    
    let winAmount = 0;
    gameState.chips.forEach(chip => {
      if (chip.betType === 'straight' && chip.betValue === winningNum) {
        winAmount += chip.value * 36;
      }
    });

    setGameState(prev => ({
      ...prev,
      winningNumber: winningNum,
      balance: prev.balance + winAmount,
      isSpinning: false,
      chips: [],
      totalBet: 0,
      gameHistory: [winningNum, ...prev.gameHistory.slice(0, 10)]
    }));
  }, [gameState.chips, gameState.isSpinning]);

  const getChipColor = (value: number): string => {
    switch (value) {
      case 100: return 'bg-white border-white text-gray-900 shadow-lg';
      case 500: return 'bg-rose-500 border-rose-600 text-white shadow-lg';
      case 1000: return 'bg-blue-500 border-blue-600 text-white shadow-lg';
      case 2500: return 'bg-emerald-500 border-emerald-600 text-white shadow-lg';
      case 5000: return 'bg-amber-400 border-amber-500 text-gray-900 shadow-lg';
      default: return 'bg-gray-500 border-gray-600 text-white';
    }
  };

  const getChipLabel = (value: number): string => {
    if (value >= 1000) return `₹${value/1000}K`;
    return `₹${value}`;
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-3 overflow-hidden">
      
      {/* Compact Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center font-bold text-gray-900 text-lg">
            R
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">European Roulette</h1>
            <p className="text-amber-400 text-xs">Table #7</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-gray-900 px-6 py-2 rounded-xl font-bold text-lg">
            ₹{gameState.balance.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 h-[calc(100vh-80px)]">
        
        {/* Основная таблица - занимает 3/4 */}
        <div className="col-span-3">
          <div 
            ref={tableRef}
            className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-2xl p-3 border-2 border-amber-500/20 h-full relative"
          >
            
            {/* Фишки на столе */}
            {gameState.chips.map(chip => (
              <div
                key={chip.id}
                className={`absolute w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-xs transform -translate-x-1/2 -translate-y-1/2 z-20 shadow-lg ${getChipColor(chip.value)}`}
                style={{
                  left: `${chip.position.x}%`,
                  top: `${chip.position.y}%`,
                }}
              >
                {getChipLabel(chip.value)}
              </div>
            ))}

            {/* Компактная сетка стола - заполняем всё пространство */}
            <div className="grid grid-cols-13 grid-rows-6 gap-1 h-full">
              
              {/* Сектор 0 - занимает 1 колонку и 2 ряда */}
              <div className="col-span-1 row-span-2">
                <div 
                  className="h-full bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl cursor-pointer hover:bg-emerald-500 transition-all border border-emerald-500"
                  onClick={(e) => placeChip('straight', 0, e.clientX, e.clientY)}
                >
                  0
                </div>
              </div>

              {/* Основные числа 1-36 - занимают 9 колонок и 4 ряда */}
              <div className="col-span-9 row-span-4 grid grid-rows-12 gap-0.5">
                {numbersLayout.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-3 gap-0.5">
                    {row.map(num => (
                      <div
                        key={num}
                        className={`h-full rounded flex items-center justify-center text-white font-bold text-sm cursor-pointer transition-all border border-white/10 min-h-[30px] ${getNumberColor(num)}`}
                        onClick={(e) => placeChip('straight', num, e.clientX, e.clientY)}
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Колонки справа - занимают 3 колонки и 4 ряда */}
              <div className="col-span-3 row-span-4 grid grid-rows-3 gap-1">
                {['1st', '2nd', '3rd'].map((column, index) => (
                  <div 
                    key={column}
                    className="bg-slate-800/90 rounded-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-slate-700 transition-all border border-slate-600"
                    onClick={(e) => placeChip('column', column, e.clientX, e.clientY)}
                  >
                    {column} COL
                  </div>
                ))}
              </div>

              {/* Нижние внешние ставки - занимают всю ширину и 2 ряда */}
              <div className="col-span-13 row-span-2 grid grid-cols-9 gap-1">
                <div 
                  className="bg-slate-800/90 rounded flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:bg-slate-700 transition-all border border-slate-600"
                  onClick={(e) => placeChip('dozen', '1st', e.clientX, e.clientY)}
                >
                  1-12
                </div>
                <div 
                  className="bg-slate-800/90 rounded flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:bg-slate-700 transition-all border border-slate-600"
                  onClick={(e) => placeChip('dozen', '2nd', e.clientX, e.clientY)}
                >
                  13-24
                </div>
                <div 
                  className="bg-slate-800/90 rounded flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:bg-slate-700 transition-all border border-slate-600"
                  onClick={(e) => placeChip('dozen', '3rd', e.clientX, e.clientY)}
                >
                  25-36
                </div>
                <div 
                  className="bg-rose-600 rounded flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:bg-rose-500 transition-all border border-rose-500"
                  onClick={(e) => placeChip('red-black', 'red', e.clientX, e.clientY)}
                >
                  RED
                </div>
                <div 
                  className="bg-gray-900 rounded flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:bg-gray-800 transition-all border border-gray-700"
                  onClick={(e) => placeChip('red-black', 'black', e.clientX, e.clientY)}
                >
                  BLACK
                </div>
                <div 
                  className="bg-slate-800/90 rounded flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:bg-slate-700 transition-all border border-slate-600"
                  onClick={(e) => placeChip('even-odd', 'even', e.clientX, e.clientY)}
                >
                  EVEN
                </div>
                <div 
                  className="bg-slate-800/90 rounded flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:bg-slate-700 transition-all border border-slate-600"
                  onClick={(e) => placeChip('even-odd', 'odd', e.clientX, e.clientY)}
                >
                  ODD
                </div>
                <div 
                  className="bg-slate-800/90 rounded flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:bg-slate-700 transition-all border border-slate-600"
                  onClick={(e) => placeChip('high-low', '1-18', e.clientX, e.clientY)}
                >
                  1-18
                </div>
                <div 
                  className="bg-slate-800/90 rounded flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:bg-slate-700 transition-all border border-slate-600"
                  onClick={(e) => placeChip('high-low', '19-36', e.clientX, e.clientY)}
                >
                  19-36
                </div>
              </div>
            </div>

            {/* История спинов */}
            <div className="absolute top-2 right-2 bg-black/70 rounded-lg p-2">
              <div className="flex space-x-1">
                {gameState.gameHistory.slice(0, 8).map((num, index) => (
                  <div
                    key={index}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      num === 0 ? 'bg-emerald-500' : 
                      getNumberColor(num).includes('rose') ? 'bg-rose-500' : 'bg-gray-800'
                    }`}
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>

            {/* Общая ставка */}
            <div className="absolute bottom-2 left-2 bg-black/70 rounded-lg px-3 py-1">
              <div className="text-green-400 text-sm font-bold">
                Bet: <span className="text-amber-400">₹{gameState.totalBet}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Боковая панель управления */}
        <div className="col-span-1 space-y-2">
          
          {/* Выбор фишек */}
          <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 h-[40%]">
            <h3 className="text-white font-bold mb-3 text-center text-sm">Chips</h3>
            <div className="space-y-2 h-[calc(100%-2rem)] flex flex-col justify-between">
              {chipValues.map(value => (
                <button
                  key={value}
                  className={`w-full py-3 rounded-lg flex items-center justify-center font-bold transition-all flex-1 ${getChipColor(value)} ${
                    gameState.currentBet === value ? 'ring-2 ring-amber-300 scale-105' : ''
                  }`}
                  onClick={() => setGameState(prev => ({ ...prev, currentBet: value }))}
                >
                  {getChipLabel(value)}
                </button>
              ))}
            </div>
          </div>

          {/* Управление */}
          <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 h-[30%]">
            <div className="space-y-2 h-full flex flex-col justify-between">
              <div className="text-center">
                <div className="text-slate-300 text-sm">Current Bet</div>
                <div className="text-amber-400 font-bold text-xl">₹{gameState.currentBet}</div>
              </div>
              
              <button
                onClick={clearBets}
                disabled={gameState.chips.length === 0}
                className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white py-2 rounded-lg font-bold transition-all disabled:opacity-50 flex-1"
              >
                CLEAR
              </button>
              
              <button
                onClick={spinWheel}
                disabled={gameState.chips.length === 0 || gameState.isSpinning}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-600 disabled:to-slate-700 text-gray-900 font-bold py-2 rounded-lg transition-all disabled:opacity-50 flex-1"
              >
                {gameState.isSpinning ? 'SPINNING...' : 'SPIN'}
              </button>
            </div>
          </div>

          {/* Статистика */}
          <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 h-[15%]">
            <h3 className="text-white font-bold mb-1 text-center text-sm">Stats</h3>
            <div className="grid grid-cols-3 gap-1 text-xs">
              <div className="text-center">
                <div className="text-slate-300">Hot</div>
                <div className="text-rose-400 font-bold">15</div>
              </div>
              <div className="text-center">
                <div className="text-slate-300">Cold</div>
                <div className="text-blue-400 font-bold">27</div>
              </div>
              <div className="text-center">
                <div className="text-slate-300">Last</div>
                <div className="text-amber-400 font-bold">2nd</div>
              </div>
            </div>
          </div>

          {/* Информация о ставках */}
          <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 h-[15%]">
            <div className="text-center h-full flex flex-col justify-center">
              <div className="text-slate-300 text-sm">Chips on table</div>
              <div className="text-green-400 font-bold text-lg">{gameState.chips.length}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CompactRouletteTable;