import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, phone, subject, organization, message, newsletter } = body;

    if (!first_name || !last_name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'First name, last name, email, subject, and message are required.' },
        { status: 400 }
      );
    }

    const trimmed = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      subject,
      organization: organization?.trim() || null,
      message: message.trim(),
      newsletter: !!newsletter,
    };

    // Save to Supabase (admin leads)
    const supabase = createAdminClient();
    const { error } = await supabase.from('contact_submissions').insert({
      ...trimmed,
      status: 'new',
    });

    if (error) {
      console.error('Failed to save contact submission:', error);
    }

    // Forward to Formspree
    const isNewsletter = trimmed.subject === 'newsletter';
    const formspreeId = isNewsletter ? 'xjgaynev' : 'mnjgpeba';

    try {
      await fetch(`https://formspree.io/f/${formspreeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${trimmed.first_name} ${trimmed.last_name}`,
          email: trimmed.email,
          ...(isNewsletter ? {} : {
            phone: trimmed.phone,
            subject: trimmed.subject,
            organization: trimmed.organization,
            message: trimmed.message,
            newsletter: trimmed.newsletter ? 'Yes' : 'No',
          }),
        }),
      });
    } catch (formspreeError) {
      console.error('Formspree submission failed:', formspreeError);
    }

    return NextResponse.json({
      success: true,
      message: 'Message received. We will be in touch within 2 business days.',
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request.' },
      { status: 400 }
    );
  }
}
