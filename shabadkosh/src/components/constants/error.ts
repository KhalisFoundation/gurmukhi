import { StringyObject } from '../../types';

const errorCodes: StringyObject = {
  'auth/user-not-found': 'No user found with this email id.',
  'auth/email-already-in-use': 'The email address is already in use.',
  'auth/invalid-email': 'The email address is invalid.',
  'auth/operation-not-allowed': 'The email/password accounts are not enabled.',
  'auth/weak-password': 'The password is too weak.',
};

export default errorCodes;
