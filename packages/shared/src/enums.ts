export const SurveyAnonymityMode = {
  ANONYMOUS: 'ANONYMOUS',
  PUBLIC_LIST: 'PUBLIC_LIST',
  NAMED: 'NAMED',
} as const;
export type SurveyAnonymityMode = (typeof SurveyAnonymityMode)[keyof typeof SurveyAnonymityMode];

export const SurveyStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  CLOSED: 'CLOSED',
} as const;
export type SurveyStatus = (typeof SurveyStatus)[keyof typeof SurveyStatus];

export const QuestionType = {
  SINGLE_CHOICE: 'SINGLE_CHOICE',
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  TEXT: 'TEXT',
} as const;
export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export const FriendRequestStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
} as const;
export type FriendRequestStatus = (typeof FriendRequestStatus)[keyof typeof FriendRequestStatus];

export const GroupMemberRole = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;
export type GroupMemberRole = (typeof GroupMemberRole)[keyof typeof GroupMemberRole];
