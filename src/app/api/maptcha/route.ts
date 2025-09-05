/**
 * MAPTCHA API Routes
 * Handles math CAPTCHA challenge generation and validation
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { maptchaService } from '../../../modules/maptcha';

const ValidateSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  answer: z.union([z.string(), z.number()]),
});

/**
 * GET /api/maptcha
 * Generate a new math challenge
 */
export async function GET() {
  try {
    const challenge = maptchaService.generateChallenge();

    return NextResponse.json({
      success: true,
      data: challenge,
    });

  } catch (error) {
    console.error('[MAPTCHA API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/maptcha
 * Validate a challenge response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, answer } = ValidateSchema.parse(body);

    const isValid = maptchaService.validateChallenge(token, answer);

    return NextResponse.json({
      success: true,
      data: { valid: isValid },
    });

  } catch (error: any) {
    console.error('[MAPTCHA API] POST error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to validate challenge' },
      { status: 500 }
    );
  }
}
