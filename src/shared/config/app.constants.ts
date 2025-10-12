export enum ENVIRONMENT_TYPE {
  DEVELOPMENT = "development",
  PRODUCTION = "production",
  STAGING = "staging",
}

export enum STATUS {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
  VERIFIED = "VERIFIED",
}

export enum APP_STATUS {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
  BLOCKED = "blocked",
}

export enum ACCOUNT_STATUS {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
  BLOCKED = "blocked",
}

export enum USER_TYPE {
  ADMIN = "admin",
  USER = "user",
}

export enum RANDOM_STRING_TYPE {
  NUM = "num",
  UPPER = "upper",
  LOWER = "lower",
  UPPER_NUM = "upper-num",
  LOWER_NUM = "lower-num",
  ALPHA = "alpha",
  ALPHA_NUM = "alpha-num",
}

export enum WS_EVENT {
  CONNECTION = "connection",
  DISCONNECTED = "disconnected",

  CHAT_JOIN = "join_chat",
  CHAT_MESSAGE = "chat_message",

  ROOM_JOINED = "room_joined",
  USER_JOINED_ROOM = "user_joined_room",
  USER_JOINED_CHAT = "user_joined_chat",
  SEND_CHAT_MESSAGE = "send_chat_message",
  JOIN = "join",
}
export enum RECYCLE_REQUEST_STATUS {
  Pending = 0,
  Approved = 1,
  Confirmed = 2,
  Cancelled = 3,
  Rejected = 4,
  Completed = 5,
}
