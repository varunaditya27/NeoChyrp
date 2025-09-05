/**
 * Login API
 * Handles user authentication with special admin account handling
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/src/lib/db';
import { ADMIN_USERNAME, ADMIN_PASSWORD } from '@/src/lib/auth/adminAccess';

const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = LoginSchema.parse(body);

    // Check for special admin credentials first
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Create or find the admin user
      let adminUser = await prisma.user.findUnique({
        where: { username: ADMIN_USERNAME }
      });

      if (!adminUser) {
        // Create the admin user if it doesn't exist
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
        adminUser = await prisma.user.create({
          data: {
            username: ADMIN_USERNAME,
            email: 'admin@neochyrp.com',
            password: hashedPassword,
            displayName: 'Site Administrator',
            role: 'ADMIN',
            bio: 'Primary site administrator',
          }
        });
      } else if (adminUser.role !== 'ADMIN') {
        // Auto-elevate if the stored role was downgraded
        adminUser = await prisma.user.update({ where: { id: adminUser.id }, data: { role: 'ADMIN' } });
      }

      // Generate JWT token for admin
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const token = jwt.sign(
        {
          userId: adminUser.id,
          username: adminUser.username,
          role: adminUser.role
        },
        secret,
        { expiresIn: '24h' }
      );

      const response = NextResponse.json({
        success: true,
        user: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          displayName: adminUser.displayName,
          role: adminUser.role,
          bio: adminUser.bio,
          createdAt: adminUser.createdAt
        }
      });

      // Set canonical cookie
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 // 24 hours
      });
      // Set legacy cookie (temporary) for backward compatibility
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 // 24 hours
      });

      return response;
    }

    // Find user by username or email (regular login)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ]
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      secret,
      { expiresIn: '7d' }
    );

    // Create response with secure cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    });

    // Set canonical cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });
    // Also set legacy cookie (TODO: remove after Q3 2025)
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error) {
    console.error('[Login] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid login data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
