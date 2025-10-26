export interface User {
  id: string;
  linkedinId: string;
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  headline?: string;
  summary?: string;
  positions?: any[];
  educations?: any[];
  skills?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  authenticated: boolean;
  user?: User;
}

export interface UserResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface ProfileResponse {
  success: boolean;
  profile?: any;
  message?: string;
}
