// Frequently asked questions, typed. The data lives in faq.json. The answers
// are the business's own words: never invent one.
import data from './faq.json';

export interface Question {
  question: string;
  answer: string;
}

export const faq = data as { section: { note: string; title: string }; questions: Question[] };
