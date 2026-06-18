export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: number;
  username: string;
  email: string;
  roleName: string;
  status: UserStatus;
  createdAt: string;
}

export interface UserRequest {
  username: string;
  email: string;
  password?: string;
  roleName: string;
  status: UserStatus;
}
