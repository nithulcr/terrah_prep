// ============================================
// TERRAH PREP - PDF EXPORT API
// ============================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { usageService } from '@/lib/services/usage.service';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    const { testResultId } = body;

    if (!testResultId) {
      return NextResponse.json({ error: 'Test result ID is required' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has PDF export permission
    const { plan } = await usageService.getUserUsageWithPlan(supabase, user.id);
    
    if (!plan || !plan.allow_pdf_download) {
      return NextResponse.json(
        { error: 'PDF export is not available in your current plan. Please upgrade to Premium or Elite.' },
        { status: 403 }
      );
    }

    // Get test result with all details
    const { data: testResult, error: testResultError } = await supabase
      .from('test_results')
      .select('*, batch:batches(*), user_answers(*, question:questions(*))')
      .eq('id', testResultId)
      .eq('user_id', user.id)
      .single();

    if (testResultError || !testResult) {
      return NextResponse.json({ error: 'Test result not found' }, { status: 404 });
    }

    // Generate PDF content (simplified - in production, use a PDF library like puppeteer or jsPDF)
    const pdfContent = generatePDFContent(testResult);

    return NextResponse.json({
      success: true,
      pdfContent,
      testResult: {
        id: testResult.id,
        batch_name: (testResult as any).batch?.batch_name,
        score: testResult.score,
        total_questions: testResult.total_questions,
        percentage: testResult.percentage,
        created_at: testResult.created_at,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generatePDFContent(testResult: any): string {
  const batch = (testResult as any).batch;
  const userAnswers = (testResult as any).user_answers || [];
  
  let content = `
    <html>
    <head>
      <title>Test Result - ${batch?.batch_name || 'Unknown'}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .question { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .correct { color: green; font-weight: bold; }
        .wrong { color: red; font-weight: bold; }
        .skipped { color: orange; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Test Result</h1>
        <h2>${batch?.batch_name || 'Unknown Batch'}</h2>
        <p>Date: ${new Date(testResult.created_at).toLocaleDateString()}</p>
      </div>
      
      <div class="summary">
        <h3>Summary</h3>
        <p><strong>Score:</strong> ${testResult.score}/${testResult.total_questions}</p>
        <p><strong>Percentage:</strong> ${testResult.percentage}%</p>
        <p><strong>Correct:</strong> ${testResult.correct_answers}</p>
        <p><strong>Wrong:</strong> ${testResult.wrong_answers}</p>
        <p><strong>Skipped:</strong> ${testResult.skipped_answers}</p>
        <p><strong>Negative Marks:</strong> ${testResult.negative_marks}</p>
        <p><strong>Time Taken:</strong> ${Math.floor(testResult.time_taken_seconds / 60)}m ${testResult.time_taken_seconds % 60}s</p>
      </div>
  `;

  // Add each question with user's answer
  userAnswers.forEach((answer: any, index: number) => {
    const question = answer.question;
    const status = answer.is_correct ? 'correct' : answer.selected_option === null ? 'skipped' : 'wrong';
    
    content += `
      <div class="question">
        <h4>Question ${index + 1}</h4>
        <p>${question.question}</p>
        <p><strong>Your Answer:</strong> ${answer.selected_option || 'Not answered'}</p>
        <p><strong>Correct Answer:</strong> <span class="correct">${question.correct_option}</span></p>
        ${question.explanation ? `<p><strong>Explanation:</strong> ${question.explanation}</p>` : ''}
        <p><strong>Status:</strong> <span class="${status}">${status.toUpperCase()}</span></p>
      </div>
    `;
  });

  content += `
    </body>
    </html>
  `;

  return content;
}