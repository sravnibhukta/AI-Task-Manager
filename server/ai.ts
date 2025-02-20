import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getSuggestions(task: string): Promise<string[]> {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key is not configured");
    return [];
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful task management assistant. Given a task, suggest 3 related or follow-up tasks that would help complete the overall goal. Return as JSON array of strings.",
        },
        {
          role: "user", 
          content: task
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("Empty response from OpenAI");
      return [];
    }

    const result = JSON.parse(content);
    return Array.isArray(result.suggestions) ? result.suggestions : [];
  } catch (error) {
    console.error("Failed to get AI suggestions:", error);
    if (error.status === 429) {
      console.error("OpenAI API rate limit exceeded or insufficient quota");
    }
    return [];
  }
}