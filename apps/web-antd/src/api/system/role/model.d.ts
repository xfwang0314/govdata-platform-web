export interface Role {
  roleId: number;
  roleName: string;
  roleKey: string;
  roleSort: number;
  ownerDeptId: number;
  ownerDeptName?: string;
  menuCheckStrictly: boolean;
  status: string;
  remark: string;
  createTime: string;
  // 用户是否存在此角色标识 默认不存在
  flag: boolean;
  superAdmin: boolean;
}
