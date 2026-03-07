import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, phone, subject, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'Name, email, and message are required.' },
      { status: 400 }
    );
  }

  // TODO: Send email via SendGrid, Resend, or similar service
  // For now, log and return success
  console.log('Contact form submission:', { name, email, phone, subject, message });

  return NextResponse.json({ success: true, message: 'Message received. We will be in touch within 2 business days.' });
}
