import { OpenAI } from "openai";

const openaiApiKey = process.env.OPENAI_API_KEY;

let client = new OpenAI({
    openaiApiKey,
  });

export function createFileReview(fileContent) {
  const completions = client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 2500,
    messages: [
      {
        role: "system",
        content: `You are a code reviewer assistant. You will provide the issues, improvements and best practices to the code provided to you.
        You will also provide the links for any best practices that can be followed.
        `,
      },
      {
        role: "user",
        content: `Review the given code: ${fileContent}`,
      },
    ],
  });
  return completions;
};

export function createLineSpecificReview(fileContent) {
  const completions = client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 2000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a code reviewer assistant.`,
      },
      {
        role: "user",
        content: `
        You will provide the issues, improvements and best practices to the complete code provided to you as per below rules: 
        1. Provide the result object should be 
        {
            line: <line_number>,
            actual: <actual code line>,
            suggested_change: <suggested code changes or code changes improvements>,
            explantions: <Brief explanation of the does the suggested code change does>
        }
        2. Give all suggestions as per the format provided ONLY.
        4. DO NOT GIVE full suggested code.
        5. Give the answer in flat JSON array. And DO NOT FORMAT.
        6. Ensure that the response is strictly in JSON format with no additional text.
        Review the below code: 
        ${fileContent}
        `,
      },
    ],
  });
  return completions;
}