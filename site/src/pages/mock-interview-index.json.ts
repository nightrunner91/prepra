import { getMockInterviewQuestions } from "../lib/mock-interview/build";

export async function GET() {
  const questions = await getMockInterviewQuestions();

  return new Response(JSON.stringify(questions), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
