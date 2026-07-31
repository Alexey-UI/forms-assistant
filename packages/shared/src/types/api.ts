import type {
  FriendRequestStatus,
  GroupMemberRole,
  QuestionType,
  SurveyAnonymityMode,
  SurveyStatus,
} from '../enums';

export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

// refreshToken передаётся отдельно как httpOnly cookie, а не в теле ответа.
export interface AuthResponseDto {
  user: UserDto;
  accessToken: string;
}

export interface FriendRequestDto {
  id: string;
  status: FriendRequestStatus;
  createdAt: string;
  fromUser: UserDto;
  toUser: UserDto;
}

export interface GroupMemberDto {
  user: UserDto;
  role: GroupMemberRole;
  canWrite: boolean;
  joinedAt: string;
}

export interface GroupDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  memberCount: number;
  myRole: GroupMemberRole | null;
  unreadCount: number;
}

export interface GroupDetailDto extends GroupDto {
  members: GroupMemberDto[];
}

export interface GroupMessageDto {
  id: string;
  groupId: string;
  author: UserDto;
  text: string;
  editedAt: string | null;
  createdAt: string;
}

export interface GroupMessagePageDto {
  messages: GroupMessageDto[];
  nextCursor: string | null;
}

export interface GroupUnreadSummaryDto {
  groupId: string;
  unreadCount: number;
}

export interface QuestionOptionDto {
  id: string;
  text: string;
  order: number;
}

export interface QuestionDto {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  order: number;
  options: QuestionOptionDto[];
}

export interface SurveySummaryDto {
  id: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  anonymityMode: SurveyAnonymityMode;
  allowMultipleSubmissions: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  responseCount: number;
}

export interface SurveyDetailDto extends SurveySummaryDto {
  questions: QuestionDto[];
  shareLinkToken: string | null;
}

export interface SurveyForTakingDto {
  id: string;
  title: string;
  description: string | null;
  anonymityMode: SurveyAnonymityMode;
  allowMultipleSubmissions: boolean;
  questions: QuestionDto[];
  requiresAuth: boolean;
  alreadySubmitted: boolean;
}

export interface SurveyResultOptionDto {
  optionId: string;
  text: string;
  count: number;
  percentage: number;
}

export interface SurveyResultQuestionDto {
  questionId: string;
  text: string;
  type: QuestionType;
  totalAnswers: number;
  options?: SurveyResultOptionDto[];
  textAnswers?: string[];
}

export interface SurveyResultsDto {
  surveyId: string;
  totalResponses: number;
  isAnonymousAggregate: boolean;
  questions: SurveyResultQuestionDto[];
}

export interface SurveyParticipantDto {
  user: UserDto;
  completedAt: string;
}
