export interface IRegistration {
  identifier: string,
  firstName: string,
  lastName: string,
  password?: string,
  confirmPassword?: string,
  phone: string,
  address: string,
  cityOfResidence: string,
  latitude: number,
  longitude: number,
  token: string; 
}

// Google Auth Types
export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}