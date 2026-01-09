import { NextResponse } from 'next/server';
import { getSmsCredits } from '../../../services/brevo-sms.service.js';
import { requireAuth } from '../../../utils/auth-middleware.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const creditsInfo = await getSmsCredits();
    return NextResponse.json({
      success: true,
      credits: creditsInfo.credits,
      planType: creditsInfo.planType,
      creditsType: creditsInfo.creditsType,
    });
  } catch (error) {
    console.error('Error getting SMS credits:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erreur lors de la récupération des crédits',
        success: false,
      },
      { status: 500 }
    );
  }
}

