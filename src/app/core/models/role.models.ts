export interface Role {
  id: number;
  name: string;
  description: string;
  permissionCount: number;
  permissionIds: number[];
  createdAt: string;
}

export interface RoleRequest {
  name: string;
  description: string;
  permissionIds: number[];
}
