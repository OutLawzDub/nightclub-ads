import { NextResponse } from 'next/server';
import { ensureDatabaseConnection } from '../database-wrapper.js';
import { findAllUsers, createUser } from '../../../services/user.service.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureDatabaseConnection();
    const users = await findAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await ensureDatabaseConnection();
    const userData = await request.json();
    const user = await createUser(userData);
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

