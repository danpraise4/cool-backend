export interface IUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface ISettings {
  isEmailNotificationsEnabled: boolean;
  isSmsNotificationsEnabled: boolean;
  isPushNotificationsEnabled: boolean;
}

