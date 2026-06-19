import * as zod from 'zod';

const loginSchema = zod.object({
  mobile: zod.string().min(10).max(15),
  password: zod.string().min(6),
});

const quizFormSchema = zod.object({
  title: zod.string().min(3),
  question: zod.string().min(5),
  optionA: zod.string().min(1),
  optionB: zod.string().min(1),
  optionC: zod.string().min(1),
  optionD: zod.string().min(1),
  correctAnswerIndex: zod.number().min(0).max(3),
  rewardAmount: zod.number().min(1),
});

describe('Validation Schemas Unit Tests', () => {
  test('should validate correct login credentials', () => {
    const data = { mobile: '9876543210', password: 'securepassword' };
    expect(loginSchema.safeParse(data).success).toBe(true);
  });

  test('should fail login when password is too short', () => {
    const data = { mobile: '9876543210', password: '123' };
    expect(loginSchema.safeParse(data).success).toBe(false);
  });

  test('should validate correct daily quiz parameters', () => {
    const data = {
      title: 'Trivia Round 1',
      question: 'What is the capital of India?',
      optionA: 'Mumbai',
      optionB: 'New Delhi',
      optionC: 'Chennai',
      optionD: 'Kolkata',
      correctAnswerIndex: 1,
      rewardAmount: 100,
    };
    expect(quizFormSchema.safeParse(data).success).toBe(true);
  });
});
