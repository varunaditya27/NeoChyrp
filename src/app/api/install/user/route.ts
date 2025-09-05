/**
 * Installation User API
 * Creates the initial administrator account during installation
 */

import bcrypt from 'bcryptjs';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/src/lib/db';

const UserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(1, 'Display name is required')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, email, displayName } = UserSchema.parse(body);

    // Check if any users already exist
    const existingUserCount = await prisma.user.count();
    if (existingUserCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Admin user already exists' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the admin user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        displayName,
        password: hashedPassword,
  role: 'OWNER' // Owner has all permissions
      }
    });

    // Store admin user ID in settings
    await prisma.setting.upsert({
      where: { key: 'admin_user_id' },
      update: { value: user.id },
      create: { key: 'admin_user_id', value: user.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('[Install User] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid user data', details: error.errors },
        { status: 400 }
      );
    }

    // Handle unique constraint errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: 'Username or email already exists' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
}
