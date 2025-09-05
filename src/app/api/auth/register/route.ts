import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/src/lib/db';
import { generateToken, setAuthCookie } from '@/src/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, displayName } = await request.json();

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Use username as email if no email provided
    const userEmail = email || `${username}@localhost.local`;

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: userEmail }
        ]
      }
    });

    if (existingUser) {
      const field = existingUser.username === username ? 'Username' : 'Email';
      return NextResponse.json(
        { success: false, error: `${field} already exists` },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email: userEmail,
        password: hashedPassword,
        displayName: displayName || username,
        role: 'USER' // Default role for registered users
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        avatarUrl: true,
        bio: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user,
      message: 'Registration successful'
    });

    // Set HTTP-only cookie
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
