import { User } from 'firebase/auth';
import { ReactNode } from 'react';
import { TimestampType } from './timestamp';

export interface NewUserType {
  id?: string,
  displayName?: string,
  email?: string,
  role?: string,
  created_at: TimestampType,
  created_by: string,
  updated_at: TimestampType,
  updated_by: string,
}

export interface LocalUser {
  user: User | null,
  uid?: string,
  email?: string,
  displayName?: string,
  photoURL?: string
  role?: string,
  username?: string
}

export interface ChildrenProps {
  children?: ReactNode
}

export type UserState = {
  auth: {
    user: LocalUser
  }
};
