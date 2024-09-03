import { OpenAI } from "openai";
import { loadSchemaFile } from "../utils/schema-loader.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const MAX_TOKENS = process.env.MAX_TOKENS || 2000;

const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export function createFileReview(fileContent) {
  const completions = client.chat.completions.create({
    model: AI_MODEL,
    max_tokens: MAX_TOKENS,
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
}

export const createLineSpecificReviewAndSummary = async(fileContent) => {
  const schema = await loadSchemaFile('response.schema.json');
  const completions = client.chat.completions.create({
    model: AI_MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: "system",
        content: `You are a code reviewer assistant.`,
      },
      {
        role: "user",
        content: `
        You will review complete code step by step and will
        provide all possible issues, improvements, document for methods if missing and best practices as per below rules: 
        1. Provide the result object should be 
        {
            original_line: <original code line number>,
            original_code: <original code line>,
            suggested_change: <suggested code changes or code changes improvements>,
            explantions: <Brief explanation of the does the suggested code change does>
            document?: <document for method if it is missing otherwise give null>
        }
        2. Give all suggestions as per the format provided ONLY.
        3. Consider everything for actual code line number.
        Review the below code: 
        ${fileContent}
        `,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "review_response",
        schema: schema,
        strict: true,
      },
    },
  });
  return completions;
}


const res  = await createLineSpecificReviewAndSummary(`
  function foo(arr) {
  const len = arr.length;
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return ar;
}
const arr1 = [64, 34, 25, 12, 22, 11, 90];
console.log(foo(arr1));

  `)

  console.log(res)