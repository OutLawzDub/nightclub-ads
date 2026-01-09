import { NextResponse } from 'next/server';
import { ensureDatabaseConnection } from '../../database-wrapper.js';
import { updateUser } from '../../../../services/user.service.js';
import User from '../../../../models/user.model.js';
import { requireAuth } from '../../../../utils/auth-middleware.js';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    await ensureDatabaseConnection();
    const { id } = params;
    const userData = await request.json();
    
    const user = await updateUser(id, userData);
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    await ensureDatabaseConnection();
    const { id } = params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    await user.destroy();
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

