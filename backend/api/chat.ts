import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Vous êtes un assistant virtuel de BAI Formation Consulting. Vous aidez les utilisateurs à trouver des informations sur les formations et à répondre à leurs questions. Répondez toujours en français de manière professionnelle et concise."
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return new Response(JSON.stringify({
      response: completion.choices[0].message.content
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erreur API Chat:', error);
    return new Response(JSON.stringify({
      error: 'Une erreur est survenue lors du traitement de votre demande'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 