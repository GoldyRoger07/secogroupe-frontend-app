export interface Permission {
  id: number;
  name: string;
  description: string;
  module: string;
  action: string;
  createdAt: string;
}

export interface PermissionRequest {
  name: string;
  description: string;
  module: string;
  action: string;
}
