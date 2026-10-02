import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verificación del webhook de Meta WhatsApp
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ status: 'active' });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Payload invalido' }, { status: 400 });
  }
}