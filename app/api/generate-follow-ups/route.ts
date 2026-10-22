import { NextRequest, NextResponse } from 'next/server';
import { readingLimitResponse } from '../../../lib/reading-quota';
import {
  FOLLOWUP_MAX_TOKENS,
  chatCompletionBody,
  describeTogetherFailure,
  logTogetherFailure,
} from '../../../lib/together';

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY!;

export async function POST(req: NextRequest) {
  const limited = await readingLimitResponse(req);
  if (limited) return limited;

  try {
    const { question } = await req.json();
    if (!question?.trim()) {
      return NextResponse.json({ questions: [] });
    }

    const chatBody = chatCompletionBody({
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
    });

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatBody),
    });

    if (!response.ok) {
      const error = await response.text();
      logTogetherFailure(
        describeTogetherFailure('generate-follow-ups', chatBody.model, response.status, error),
      );
      return NextResponse.json({ questions: [] });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    if (!content.trim()) {
      console.error(
        `generate-follow-ups: empty model content model=${chatBody.model} finish=${data.choices?.[0]?.finish_reason ?? 'unknown'}`,
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
