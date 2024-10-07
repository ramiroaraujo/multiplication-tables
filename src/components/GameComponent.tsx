'use client';

import React, { useState, useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Toggle } from '@/components/ui/toggle';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { machine, timeLimit } from '@/lib/game';
import { cn } from '@/lib/utils';

export default function GameComponent() {
  const [state, send] = useMachine(machine);
  const [selectedDifficulty, setSelectedDifficulty] = useState(1);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [progress, setProgress] = useState(100);
  const [lastAnsweredOption, setLastAnsweredOption] = useState<number | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (state.matches({ playing: 'question' }) && state.context.questionStartTime) {
      const updateProgress = () => {
        const elapsedTime = Date.now() - state.context.questionStartTime!;
        const totalTime = timeLimit[state.context.difficulty as 1 | 2 | 3];
        const newProgress = Math.max(0, 100 - (elapsedTime / totalTime) * 100);
        setProgress(newProgress);
      };

      intervalId = setInterval(updateProgress, 50);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [state.context.questionStartTime, state.context.difficulty, state.value]);

  useEffect(() => {
    if (state.matches({ playing: 'result' })) {
      const timer = setTimeout(() => {
        send({ type: 'NEXT' });
        setLastAnsweredOption(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [state, send]);

  const handleStart = () => {
    if (selectedNumbers.length < 2) {
      alert('Por favor, elegí al menos 2 números');
      return;
    }
    send({ type: 'SELECT', difficulty: selectedDifficulty, selectedNumbers });
  };

  const handleAnswer = (selectedOption: number) => {
    if (state.matches({ playing: 'question' })) {
      setLastAnsweredOption(selectedOption);
      send({ type: 'ANSWER', selectedOption });
    }
  };

  const handleRestart = () => {
    send({ type: 'RESTART' });
    setSelectedNumbers([]);
    setLastAnsweredOption(null);
  };

  const toggleNumber = (number: number) => {
    setSelectedNumbers((prev) =>
      prev.includes(number) ? prev.filter((n) => n !== number) : [...prev, number]
    );
  };

  return (
    <div className="flex flex-col w-full max-w-sm md:max-w-md mx-auto px-4 py-6 h-full">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Tablas de Multiplicar</h1>
      <div className="flex-grow flex flex-col justify-between">
        <div className="flex-grow flex flex-col items-center justify-center">
          {state.matches('difficultyAndNumberSelection') && (
            <div className="flex flex-col items-center w-full">
              <h2 className="text-lg md:text-xl mb-4 text-center">Elegí la dificultad</h2>
              <div className="flex gap-2 mb-4 w-full">
                {[1, 2, 3].map((level) => (
                  <Button
                    key={level}
                    onClick={() => setSelectedDifficulty(level)}
                    variant={selectedDifficulty === level ? 'default' : 'outline'}
                    className="flex-1 h-12 active:scale-95 transition-transform"
                  >
                    {level}
                  </Button>
                ))}
              </div>
              <h2 className="text-lg md:text-xl mt-4 mb-4 text-center">
                Elegí al menos 2 números para multiplicar
              </h2>
              <div className="grid grid-cols-4 gap-2 mb-4 w-full">
                {[2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                  <Toggle
                    variant="outline"
                    key={number}
                    pressed={selectedNumbers.includes(number)}
                    onPressedChange={() => toggleNumber(number)}
                    className="h-12"
                  >
                    {number}
                  </Toggle>
                ))}
              </div>
              <Button
                onClick={handleStart}
                className="w-full h-12 active:scale-95 transition-transform"
                disabled={selectedNumbers.length < 2}
              >
                Empezar Juego
              </Button>
            </div>
          )}
          {state.matches('playing') && state.context.currentQuestion && (
            <div className="flex flex-col items-center w-full">
              <h2 className="text-lg md:text-xl font-bold mb-4 text-center">
                {state.context.currentQuestion.multiplicand} ×{' '}
                {state.context.currentQuestion.multiplier} = ?
              </h2>
              <Progress value={progress} className="w-full mb-4" />
              <div className="grid grid-cols-2 gap-2 w-full">
                {state.context.currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    className={cn(
                      'w-full h-12 active:scale-95 transition-transform',
                      state.matches({ playing: 'result' }) &&
                        option === state.context.currentQuestion?.correctAnswer &&
                        'bg-green-500',
                      state.matches({ playing: 'result' }) &&
                        option === lastAnsweredOption &&
                        option !== state.context.currentQuestion?.correctAnswer &&
                        'bg-red-500'
                    )}
                    disabled={state.matches({ playing: 'result' })}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {state.matches('gameOver') && (
            <div className="flex flex-col items-center w-full">
              <h2 className="text-xl mb-4 text-center">¡Juego terminado!</h2>
              <p className="text-lg mb-4 text-center">
                Tu puntaje: {state.context.score} / {state.context.questions.length}
              </p>
              <p className="text-lg mb-4 text-center">
                Tiempo total: {(state.context.timeTaken / 1000).toFixed(2)} segundos
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Multiplicación</TableHead>
                    <TableHead className="text-center">Tu Respuesta</TableHead>
                    <TableHead className="text-center">Respuesta Correcta</TableHead>
                    <TableHead>Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.context.questions.map((question, index) => (
                    <TableRow
                      key={index}
                      className={cn(
                        state.context.results[index] ? 'bg-green-50' : 'bg-red-50',
                        'transition-colors duration-200'
                      )}
                    >
                      <TableCell>
                        {question.multiplicand} × {question.multiplier}
                      </TableCell>
                      <TableCell className="text-center">2</TableCell>
                      <TableCell className="text-center">{question.correctAnswer}</TableCell>
                      <TableCell>
                        {state.context.results[index] ? 'Correcto' : 'Incorrecto'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button
                onClick={handleRestart}
                className="w-full h-12 active:scale-95 transition-transform mt-4"
              >
                Jugar de Nuevo
              </Button>
            </div>
          )}
        </div>
      </div>
      {state.matches('playing') && (
        <div className="w-full mt-4">
          <Button
            onClick={handleRestart}
            variant="outline"
            className="w-full h-12 active:scale-95 transition-transform bg-gray-700 text-white hover:bg-gray-600"
          >
            Reiniciar
          </Button>
        </div>
      )}
    </div>
  );
}
