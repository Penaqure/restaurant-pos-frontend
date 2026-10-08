import axiosInstance from "@/lib/axiosInstance";

export type PresetQuestion = {
  label: string;
  category: string;
};

export async function fetchChatbotQuestions() {
  const { data } = await axiosInstance.get<{ questions: PresetQuestion[] }>("/chatbot/questions");
  return data.questions;
}

export async function askChatbot(text: string) {
  const { data } = await axiosInstance.post<{ answer: string }>("/chatbot/ask", { text });
  return data.answer;
}
