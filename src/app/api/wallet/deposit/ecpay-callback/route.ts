import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'ECPay is no longer supported. Use crypto deposits.' }, { status: 410 });
}
