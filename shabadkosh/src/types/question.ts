import { MiniWord } from './word';

export interface Option {
  id?: string,
  option?: string;
  translation?: string;
}

export interface QuestionData {
  id?: string;
  question?: string;
  translation?: string;
  type?: string;
  options: MiniWord[];
  answer: number;
  word_id?: string;
}

export interface NewQuestionType {
  id?: string,
  question: string,
  translation: string,
  type: string,
  options: string[],
  answer: number,
  word_id?: string
}

export interface QuestionType {
  id?: string,
  question: string,
  translation: string,
  type: string,
  options: Option[],
  answer: number,
  word_id?: string
}
