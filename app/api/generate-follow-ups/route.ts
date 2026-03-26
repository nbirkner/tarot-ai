import { NextRequest, NextResponse } from 'next/server';

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question?.trim()) {
      return NextResponse.json({ questions: [] });
    }

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
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
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ questions: [] });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    // Handle both array at root and nested in a key
    const questions = Array.isArray(parsed)
      ? parsed
      : parsed.questions || Object.values(parsed)[0] || [];

    return NextResponse.json({ questions: (questions as string[]).slice(0, 3) });
  } catch {
    return NextResponse.json({ questions: [] });
  }
}
