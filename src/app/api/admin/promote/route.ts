import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Update user role to admin
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to promote user to admin' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} promoted to admin successfully`,
      profile: data
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}