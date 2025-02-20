import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Fallback suggestions when API is unavailable
function getFallbackSuggestions(task: string): string[] {
  const suggestions = [
    `Review ${task}`,
    `Follow up on ${task}`,
    `Schedule time for ${task}`
  ];
  return suggestions;
}

export async function getSuggestions(task: string): Promise<string[]> {
  // If no API key is configured, use fallback mode
  if (!process.env.OPENAI_API_KEY) {
    console.log("OpenAI API key not configured, using fallback suggestions");
    return getFallbackSuggestions(task);
  }

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
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
      return getFallbackSuggestions(task);
    }

    const result = JSON.parse(content);
    return Array.isArray(result.suggestions) ? result.suggestions : getFallbackSuggestions(task);
  } catch (error: any) {
    console.error("Failed to get AI suggestions:", error);
    if (error.status === 429) {
      console.error("OpenAI API rate limit exceeded or insufficient quota");
    }
    return getFallbackSuggestions(task);
  }
}