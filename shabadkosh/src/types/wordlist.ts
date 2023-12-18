import { TimestampType } from './timestamp';
import { MiniWord } from './word';

export type Metadata = {
  curriculum?: string,
  level?: string,
  subgroup?: string
};

export interface NewWordlistType {
  id?: string,
  name?: string,
  metadata?: Metadata,
  status?: string,
  notes?: string,
  created_by?: string,
  created_at?: TimestampType,
  updated_by?: string,
  updated_at?: TimestampType,
  words?: string[] | MiniWord[]
}

export interface WordlistType {
  id: string,
  name?: string,
  metadata?: Metadata,
  status?: string,
  notes?: string,
  created_by: string,
  created_at: TimestampType,
  updated_by: string,
  updated_at: TimestampType,
  words?: string[] | MiniWord[]
}

export interface MiniWordlist {
  id?: string,
  name?: string
}

export interface Wordlist {
  id: string,
  name?: string
}
