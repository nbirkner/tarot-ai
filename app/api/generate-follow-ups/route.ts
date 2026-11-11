import { NextRequest, NextResponse } from 'next/server';
import { readingLimitResponse } from '../../../lib/reading-quota';
import { paidChat } from '../../../lib/together-call';
import { FOLLOWUP_MAX_TOKENS } from '../../../lib/together';

export async function POST(req: NextRequest) {
  const limited = await readingLimitResponse(req);
  if (limited) return limited;

  try {
    const { question } = await req.json();
    if (!question?.trim()) {
      return NextResponse.json({ questions: [] });
    }

    const result = await paidChat({
      messages: [
        {
          role: 'system',
          content: `You are an intuitive tarot reader preparing to do a reading. Given a seeker's question, generate exactly 2-3 short follow-up questions that would help you give a more personalized, specific reading.

Rules:
- Questions should probe the specific situation, not be generic
- Keep each question under 12 words
- Focus on: what specifically is at stake, what the person fears, what they hope for, or recent context
- Do NOT ask about their birth date, zodiac sign, or card preferences
- Respond ONLY with a JSON array of strings: ["question1", "question2", "question3"]
- No other text, no markdown`,
        },
        {
          role: 'user',
          content: `The seeker's question: "${question}"`,
        },
      ],
      temperature: 0.8,
      maxTokens: FOLLOWUP_MAX_TOKENS,
      stream: false,
      scope: 'generate-follow-ups',
    });

    if (!result.ok) {
      if (!result.failure || result.response.status === 403) return result.response;
      return NextResponse.json({ questions: [] });
    }
    if (result.mode !== 'json') {
      return NextResponse.json({ questions: [] });
    }

    const content = result.data.choices?.[0]?.message?.content || '';
    if (!content.trim()) {
      console.error(
        `generate-follow-ups: empty model content finish=${result.data.choices?.[0]?.finish_reason ?? 'unknown'}`,
      );
      return NextResponse.json({ questions: [] });
    }
    const parsed = JSON.parse(content);

    // Handle both array at root and nested in a key
    const questions = Array.isArray(parsed)
      ? parsed
      : parsed.questions || Object.values(parsed)[0] || [];

    return NextResponse.json({ questions: (questions as string[]).slice(0, 3) });
  } catch (err) {
    console.error('generate-follow-ups error:', err);
    return NextResponse.json({ questions: [] });
  }
}
