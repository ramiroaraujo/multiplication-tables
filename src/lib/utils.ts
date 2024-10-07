import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const correctAnswerExpressions = [
  '¡Bien ahí!',
  '¡Golazo!',
  '¡Qué capo/a!',
  '¡Sos un crack!',
  '¡La rompiste!',
  '¡Sos un fenómeno!',
  '¡Qué grande!',
  '¡Excelente, che!',
  '¡Maravilloso, pibe/a!',
  '¡Sos un/a groso/a!',
  '¡Impecable, loco/a!',
];

const incorrectAnswerExpressions = [
  '¡Uh, le erraste!',
  '¡Casi, casi!',
  '¡Por poco!',
  '¡Apa, no era esa!',
  '¡Uh, la próxima sale!',
  '¡No pasa nada, che!',
  '¡Tranqui, la próxima va!',
  '¡Uh, estuviste cerca!',
  '¡Fallaste por poco!',
  '¡No era esa, pero seguí intentando!',
  '¡Dale que la próxima sale!',
];

export function getRandomExpression(isCorrect: boolean): string {
  const expressions = isCorrect ? correctAnswerExpressions : incorrectAnswerExpressions;
  return shuffleArray(expressions)[0];
}
