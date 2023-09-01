import roles from "./roles";

export const STATUS = {
  CREATING_ENGLISH: 'creating-english',
  REVIEW_ENGLISH: 'review-english',
  FEEDBACK_ENGLISH: 'feedback-english',
  CREATING_PUNJABI: 'creating-punjabi',
  FEEDBACK_PUNJABI: 'feedback-punjabi',
  REVIEW_FINAL: 'review-final',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

// status which creator role can view
export const cstatus = [
  STATUS.CREATING_ENGLISH,
  STATUS.FEEDBACK_ENGLISH,
  STATUS.CREATING_PUNJABI,
  STATUS.FEEDBACK_PUNJABI,
];

// status which creator role can set
export const cstatus2 = [
  STATUS.CREATING_ENGLISH,
  STATUS.REVIEW_ENGLISH,
  STATUS.FEEDBACK_ENGLISH,
  STATUS.CREATING_PUNJABI,
  STATUS.REVIEW_FINAL,
  STATUS.FEEDBACK_PUNJABI
];

// status which reviewer role can set
export const rstatus = [
  STATUS.CREATING_ENGLISH,
  STATUS.REVIEW_ENGLISH,
  STATUS.FEEDBACK_ENGLISH,
  STATUS.CREATING_PUNJABI,
  STATUS.REVIEW_FINAL,
  STATUS.FEEDBACK_PUNJABI,
  STATUS.ACTIVE,
  STATUS.INACTIVE,
];

// status which admin role can set
export const astatus = [
  STATUS.CREATING_ENGLISH,
  STATUS.REVIEW_ENGLISH,
  STATUS.FEEDBACK_ENGLISH,
  STATUS.CREATING_PUNJABI,
  STATUS.REVIEW_FINAL,
  STATUS.FEEDBACK_PUNJABI,
  STATUS.ACTIVE,
  STATUS.INACTIVE,
];

export const qtypes = {
  CONTEXT: 'context',
  IMAGE: 'image',
  MEANING: 'meaning',
  DEFINITION: 'definition',
};

export const createStatus = {
  [roles.admin]: astatus,
  [roles.reviewer]: rstatus,
  [roles.creator]: cstatus,
}

export const editStatus = {
  [roles.admin]: astatus,
  [roles.reviewer]: rstatus,
  [roles.creator]: cstatus2,
}