import {NextResponse} from 'next/server'
import OpenAI from 'openai'

// console.log(process.env.local.OPENAI_API_KEY)

const systemPrompt = `You are a friend. Have a friendly conversation`

export async function POST(req) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // console.log("The api Key", openai);

    // Fix: Call the `json()` method correctly
    const data = await req.json();
    
    // Ensure `data` is an array, otherwise handle the error
    if (!Array.isArray(data)) {
        return new NextResponse('Invalid data format', { status: 400 });
    }

    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: systemPrompt
            },
            ...data,
        ],
        model: 'gpt-4o-mini',
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
                controller.error(error);
            } finally {
                controller.close();
            }
        }
    });

    return new NextResponse(stream);
}
