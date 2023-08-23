import { TimestampType } from './timestamp';

export type Metadata = {
  curriculum?: string,
  level?: string,
  subgroup?: string
};

export interface WordlistType {
  id?: string,
  name?: string,
  metadata?: Metadata,
  status?: string,
  notes?: string,
  created_by?: string,
  created_at?: TimestampType,
  updated_by?: string,
  updated_at?: TimestampType,
}

export interface MiniWordlist {
  id?: string,
  name?: string
}
