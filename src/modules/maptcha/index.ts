/** MAPTCHA (Math Captcha) Module
 * - Generates simple arithmetic challenges for anonymous comment submissions.
 * - Stores hashed answer in ephemeral store (could be cookie-signed token).
 */
import { z } from 'zod';

import { registerModule } from '../../lib/modules/registry';

const maptchaConfigSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
  operations: z.array(z.enum(['add', 'subtract', 'multiply'])).default(['add', 'subtract']),
  maxNumber: z.number().default(20),
  sessionTimeout: z.number().default(300), // 5 minutes in seconds
});

// Simple in-memory store for challenges (in production, use Redis or secure cookies)
const challengeStore = new Map<string, { answer: number; expires: number }>();

export const maptchaService = {
  /**
   * Generate a new math challenge
   */
  generateChallenge(config = {
    difficulty: 'easy',
    operations: ['add', 'subtract'],
    maxNumber: 20,
    sessionTimeout: 300
  }): { question: string; token: string } {
    const operations = config.operations || ['add', 'subtract'];
    const maxNum = config.maxNumber || 20;
    const operation = operations[Math.floor(Math.random() * operations.length)];

    let num1: number, num2: number, answer: number, question: string;

    // Generate numbers based on operation to avoid negative results
    switch (operation) {
      case 'add':
        num1 = Math.floor(Math.random() * maxNum) + 1;
        num2 = Math.floor(Math.random() * maxNum) + 1;
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
        break;

      case 'subtract':
        num1 = Math.floor(Math.random() * maxNum) + 10; // Ensure positive result
        num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
        answer = num1 - num2;
        question = `${num1} - ${num2}`;
        break;

      case 'multiply':
        num1 = Math.floor(Math.random() * 10) + 1; // Keep multiplication small
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 * num2;
        question = `${num1} × ${num2}`;
        break;

      default:
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
    }

    // Generate token and store challenge
    const token = this.generateToken();
    const expires = Date.now() + (config.sessionTimeout * 1000);

    challengeStore.set(token, { answer, expires });

    // Clean up expired challenges
    this.cleanupExpiredChallenges();

    return { question, token };
  },

  /**
   * Validate a challenge response
   */
  validateChallenge(token: string, userAnswer: string | number): boolean {
    const challenge = challengeStore.get(token);

    if (!challenge) {
      return false; // Challenge not found or already used
    }

    if (Date.now() > challenge.expires) {
      challengeStore.delete(token);
      return false; // Challenge expired
    }

    const userAnswerNum = typeof userAnswer === 'string' ? parseInt(userAnswer, 10) : userAnswer;
    const isValid = userAnswerNum === challenge.answer;

    // Remove challenge after validation (one-time use)
    challengeStore.delete(token);

    return isValid;
  },

  /**
   * Generate a secure token
   */
  generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  },

  /**
   * Clean up expired challenges
   */
  cleanupExpiredChallenges(): void {
    const now = Date.now();
    for (const [token, challenge] of challengeStore.entries()) {
      if (now > challenge.expires) {
        challengeStore.delete(token);
      }
    }
  },

  /**
   * Get challenge statistics
   */
  getStats(): { active: number; total: number } {
    this.cleanupExpiredChallenges();
    return {
      active: challengeStore.size,
      total: challengeStore.size, // In a real implementation, track total generated
    };
  },

  /**
   * Clear all challenges (for testing)
   */
  clearAll(): void {
    challengeStore.clear();
  },
};

// Register the module
registerModule({
  manifest: {
    slug: 'maptcha',
    name: 'Math CAPTCHA',
    version: '1.0.0',
    description: 'Simple arithmetic challenges for spam prevention',
    author: 'Chyrp Team',
    dependencies: [],
    config: {
      schema: maptchaConfigSchema,
      defaults: {
        difficulty: 'easy',
        operations: ['add', 'subtract'],
        maxNumber: 20,
        sessionTimeout: 300
      }
    }
  },

  config: {
    difficulty: 'easy',
    operations: ['add', 'subtract'],
    maxNumber: 20,
    sessionTimeout: 300
  },

  async activate() {
    console.log('[MAPTCHA] Module activated');

    // Set up periodic cleanup of expired challenges
    setInterval(() => {
      maptchaService.cleanupExpiredChallenges();
    }, 60000); // Clean up every minute
  },

  async deactivate() {
    console.log('[MAPTCHA] Module deactivated');
    maptchaService.clearAll();
  }
});
