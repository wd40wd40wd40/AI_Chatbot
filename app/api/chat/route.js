import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const systemPrompt = `You are a friend. Have a friendly conversation`;

export async function POST(req) {
    const groq = new Groq({
        apiKey: process.env.GROQAI_API_KEY, // Assuming GroqAI uses an API key
    });
    const data = await req.json();

    try {
        const completion = await groq.chat.completions.create({
            messages: [{
                role: 'system',
                content: systemPrompt
            },
            ...data,
            ],
            model: 'gemma2-9b-it', // Ensure this is a valid model ID
            stream: true,
        });

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of completion) {
                        const content = chunk.choices[0]?.delta?.content;
                        if (content) {
                            const text = encoder.encode(content);
                            controller.enqueue(text);
                        }
                    }
                } catch (error) {
                    console.error('Error while streaming content:', error);
                    controller.error(error); // Use the `error` object passed in
                } finally {
                    controller.close();
                }
            }
        });

        return new NextResponse(stream);

    } catch (error) {
        console.error('Error in POST handler:', error);
        return new NextResponse(JSON.stringify({ error: 'Failed to generate a response.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
