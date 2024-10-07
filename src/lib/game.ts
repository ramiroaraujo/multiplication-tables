import { assign, setup } from 'xstate';
import { shuffleArray } from '@/lib/utils';

export type Question = {
  multiplicand: number;
  multiplier: number;
  correctAnswer: number;
  options: number[];
};

export type GameContext = {
  difficulty: number;
  selectedNumbers: number[];
  questions: Question[];
  currentQuestionIndex: number;
  currentQuestion?: Question;
  lastResult?: boolean;
  results: boolean[];
  score: number;
  timeTaken: number;
  questionStartTime?: number;
};

export type GameEvents =
  | { type: 'SELECT'; difficulty: number; selectedNumbers: number[] }
  | { type: 'ANSWER'; selectedOption: number }
  | { type: 'RESTART' }
  | { type: 'NEXT' };

const generateQuestions = (selectedNumbers: number[], difficulty: number): Question[] => {
  const questions: Question[] = [];
  const possibleMultipliers = [2, 3, 4, 5, 6, 7, 8, 9];

  // Generate all possible unique combinations
  const allCombinations = selectedNumbers.flatMap((multiplicand) =>
    possibleMultipliers.map((multiplier) => ({ multiplicand, multiplier }))
  );

  // Shuffle the combinations
  const shuffledCombinations = shuffleArray(allCombinations);

  // Determine number of questions based on difficulty
  const questionCount = difficulty === 1 ? 15 : difficulty === 2 ? 20 : 30;

  // Take up to questionCount combinations
  const selectedCombinations = shuffledCombinations.slice(0, questionCount);

  for (const { multiplicand, multiplier } of selectedCombinations) {
    const correctAnswer = multiplicand * multiplier;

    // Generate options based on difficulty
    const optionsCount = difficulty === 1 ? 3 : difficulty === 2 ? 4 : 6;
    const options = generateOptions(
      correctAnswer,
      multiplicand,
      multiplier,
      optionsCount,
      difficulty
    );

    questions.push({
      multiplicand,
      multiplier,
      correctAnswer,
      options,
    });
  }

  return questions;
};

const generateOptions = (
  correctAnswer: number,
  multiplicand: number,
  multiplier: number,
  count: number,
  difficulty: number
): number[] => {
  const options = new Set<number>([correctAnswer]);

  while (options.size < count) {
    let newOption: number;

    switch (difficulty) {
      case 1:
        // 1 or 2 difference with the correct answer
        newOption = correctAnswer + (Math.random() < 0.5 ? 1 : 2) * (Math.random() < 0.5 ? 1 : -1);
        break;
      case 2:
        // Mix of case 1 and adjacent results
        if (Math.random() < 0.5) {
          newOption = multiplicand * (multiplier + (Math.random() < 0.5 ? 1 : -1));
        } else {
          newOption =
            correctAnswer + (Math.random() < 0.5 ? 1 : 2) * (Math.random() < 0.5 ? 1 : -1);
        }
        break;
      case 3:
        // Mix of case 1 and 2, matching odd/even nature
        if (Math.random() < 0.5) {
          newOption = multiplicand * (multiplier + (Math.random() < 0.5 ? 1 : -1));
        } else {
          let diff = Math.floor(Math.random() * 5) + 1;
          if (
            (correctAnswer % 2 === 0 && diff % 2 !== 0) ||
            (correctAnswer % 2 !== 0 && diff % 2 === 0)
          ) {
            diff += 1;
          }
          newOption = correctAnswer + diff * (Math.random() < 0.5 ? 1 : -1);
        }
        break;
      default:
        continue;
    }

    if (newOption > 0 && newOption !== correctAnswer) {
      options.add(newOption);
    }
  }

  return shuffleArray(Array.from(options));
};

export const timeLimit = {
  1: 10000,
  2: 5000,
  3: 2000,
};

export const machine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvents,
  },
  guards: {
    hasMoreQuestions: ({ context }) => {
      return context.currentQuestionIndex < context.questions.length - 1;
    },
    isTimeLimit: ({ context }) => {
      const currentTime = Date.now();
      const timeLimitForDifficulty = timeLimit[context.difficulty as 1 | 2 | 3];
      return currentTime - context.questionStartTime! >= timeLimitForDifficulty;
    },
  },
  actions: {
    selectDifficultyAndNumbers: assign(({ event }) => {
      if (event.type !== 'SELECT') return {};

      const questions = generateQuestions(event.selectedNumbers, event.difficulty);

      return {
        difficulty: event.difficulty,
        selectedNumbers: event.selectedNumbers,
        questions,
        currentQuestionIndex: 0,
        results: [],
        score: 0,
        currentQuestion: questions[0],
        timeTaken: 0,
        questionStartTime: Date.now(),
        lastResult: undefined,
      };
    }),
    selectNewQuestion: assign(({ context }) => {
      const currentQuestion = context.questions[context.currentQuestionIndex];
      return {
        currentQuestion,
        questionStartTime: Date.now(),
        lastResult: undefined,
      };
    }),
    timeout: assign(({ context }) => {
      const questionEndTime = Date.now();
      const questionTime = context.questionStartTime
        ? questionEndTime - context.questionStartTime
        : 0;
      return {
        lastResult: false,
        results: [...context.results, false],
        timeTaken: context.timeTaken + questionTime,
        questionStartTime: undefined,
      };
    }),
    reviewAnswer: assign(({ context, event }) => {
      if (event.type !== 'ANSWER') return context;

      const isCorrect = event.selectedOption === context.currentQuestion?.correctAnswer;
      const newScore = context.score + (isCorrect ? 1 : 0);
      const questionEndTime = Date.now();
      const questionTime = context.questionStartTime
        ? questionEndTime - context.questionStartTime
        : 0;

      return {
        lastResult: isCorrect,
        results: [...context.results, isCorrect],
        score: newScore,
        timeTaken: context.timeTaken + questionTime,
        questionStartTime: undefined,
      };
    }),
    incrementQuestionIndex: assign(({ context }) => {
      return {
        currentQuestionIndex: context.currentQuestionIndex + 1,
      };
    }),
    resetGame: assign(() => {
      return {
        difficulty: 1,
        selectedNumbers: [],
        questions: [],
        currentQuestionIndex: 0,
        currentQuestion: undefined,
        lastResult: undefined,
        results: [],
        score: 0,
        timeTaken: 0,
        questionStartTime: undefined,
      };
    }),
  },
}).createMachine({
  context: {
    difficulty: 1,
    selectedNumbers: [],
    questions: [],
    currentQuestionIndex: 0,
    results: [],
    score: 0,
    timeTaken: 0,
  },
  id: 'game',
  initial: 'difficultyAndNumberSelection',
  states: {
    difficultyAndNumberSelection: {
      on: {
        SELECT: {
          actions: 'selectDifficultyAndNumbers',
          target: 'playing',
        },
      },
    },
    playing: {
      initial: 'question',
      on: {
        RESTART: {
          actions: 'resetGame',
          target: 'difficultyAndNumberSelection',
        },
      },
      states: {
        question: {
          entry: 'selectNewQuestion',
          after: {
            3000: {
              guard: 'isTimeLimit',
              actions: 'timeout',
              target: 'result',
            },
            6000: {
              guard: 'isTimeLimit',
              actions: 'timeout',
              target: 'result',
            },
            10000: {
              guard: 'isTimeLimit',
              actions: 'timeout',
              target: 'result',
            },
          },
          on: {
            ANSWER: {
              actions: 'reviewAnswer',
              target: 'result',
            },
          },
        },
        result: {
          on: {
            NEXT: {
              target: 'next',
            },
          },
          after: {
            500: {
              target: 'next',
            },
          },
        },
        next: {
          always: [
            {
              target: 'question',
              actions: 'incrementQuestionIndex',
              guard: 'hasMoreQuestions',
            },
            {
              target: '#game.gameOver',
            },
          ],
        },
      },
    },
    gameOver: {
      on: {
        RESTART: {
          actions: 'resetGame',
          target: 'difficultyAndNumberSelection',
        },
      },
    },
  },
});
