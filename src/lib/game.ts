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

const generateQuestions = (selectedNumbers: number[]): Question[] => {
  const questions: Question[] = [];
  const possibleMultipliers = [2, 3, 4, 5, 6, 7, 8, 9];

  while (questions.length < 20) {
    const multiplicand = selectedNumbers[Math.floor(Math.random() * selectedNumbers.length)];
    const multiplier = possibleMultipliers[Math.floor(Math.random() * possibleMultipliers.length)];
    const correctAnswer = multiplicand * multiplier;

    // Generate wrong options
    const wrongOptions = new Set<number>();
    while (wrongOptions.size < 3) {
      const wrongAnswer = correctAnswer + Math.floor(Math.random() * 5) - 2; // Generate numbers close to the correct answer
      if (wrongAnswer !== correctAnswer && wrongAnswer > 0) {
        wrongOptions.add(wrongAnswer);
      }
    }

    const options = shuffleArray([correctAnswer, ...Array.from(wrongOptions)]);

    const question: Question = {
      multiplicand,
      multiplier,
      correctAnswer,
      options,
    };

    // Ensure the question is unique
    if (!questions.some((q) => q.multiplicand === multiplicand && q.multiplier === multiplier)) {
      questions.push(question);
    }
  }

  return shuffleArray(questions);
};

export const timeLimit = {
  1: 15000,
  2: 10000,
  3: 5000,
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

      const questions = generateQuestions(event.selectedNumbers);

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
            5000: {
              guard: 'isTimeLimit',
              actions: 'timeout',
              target: 'result',
            },
            10000: {
              guard: 'isTimeLimit',
              actions: 'timeout',
              target: 'result',
            },
            15000: {
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
            2500: {
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
