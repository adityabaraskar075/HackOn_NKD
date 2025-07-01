
import { NextResponse } from 'next/server';

/**
 * This API endpoint is no longer in use.
 * The UPI verification logic has been simplified to a client-side format check
 * and is handled directly within the checkout component.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated.' },
    { status: 410 } // 410 Gone
  );
}
