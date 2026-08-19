import type { DeptTree } from '#/api/system/user/model';

import { ref } from 'vue';

import { roleList } from '#/api/system/role';
import { getDeptTree, userList } from '#/api/system/user';

interface UserItem {
  nickName?: string;
  userId: string;
  userName?: string;
}

interface RoleItem {
  roleId: string;
  roleKey?: string;
  roleName: string;
}

interface DeptItem {
  id: string;
  name: string;
}

// 全局单例缓存
const userListState = ref<UserItem[]>([]);
const deptListState = ref<DeptItem[]>([]);
const roleListState = ref<RoleItem[]>([]);

const userMap = ref<Map<string, string>>(new Map());
const deptMap = ref<Map<string, string>>(new Map());
const roleMap = ref<Map<string, string>>(new Map());
let loadingPromise: null | Promise<void> = null;

export function useSubjectResolver() {
  async function loadSubjectData() {
    if (userListState.value.length > 0 && deptListState.value.length > 0)
      return;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      try {
        const [usersRes, deptsRes, rolesRes] = await Promise.allSettled([
          userList({ pageNum: 1, pageSize: 500 }),
          getDeptTree(),
          roleList({ pageNum: 1, pageSize: 500 }),
        ]);

        if (usersRes.status === 'fulfilled' && usersRes.value?.rows) {
          const uList: UserItem[] = [];
          const uMap = new Map<string, string>();
          for (const u of usersRes.value.rows) {
            const userId = `${u.userId}`;
            const displayName = u.nickName || u.userName || userId;
            uList.push({
              nickName: u.nickName,
              userId,
              userName: u.userName,
            });
            uMap.set(userId, displayName);
            if (u.userName) {
              uMap.set(u.userName, displayName);
            }
          }
          userListState.value = uList;
          userMap.value = uMap;
        }

        if (deptsRes.status === 'fulfilled' && deptsRes.value) {
          const dList: DeptItem[] = [];
          const dMap = new Map<string, string>();
          function walkDepts(items: DeptTree[]) {
            for (const item of items) {
              const id = String(item.id);
              dList.push({ id, name: item.label });
              dMap.set(id, item.label);
              if (item.children && item.children.length > 0) {
                walkDepts(item.children);
              }
            }
          }
          walkDepts(deptsRes.value);
          deptListState.value = dList;
          deptMap.value = dMap;
        }

        if (rolesRes.status === 'fulfilled' && rolesRes.value?.rows) {
          const rList: RoleItem[] = [];
          const rMap = new Map<string, string>();
          for (const r of rolesRes.value.rows) {
            const roleId = String(r.roleId);
            rList.push({
              roleId,
              roleKey: r.roleKey,
              roleName: r.roleName,
            });
            rMap.set(roleId, r.roleName);
            if (r.roleKey) {
              rMap.set(r.roleKey, r.roleName);
            }
          }
          roleListState.value = rList;
          roleMap.value = rMap;
        }
      } catch {
        // 静默兜底
      } finally {
        loadingPromise = null;
      }
    })();

    return loadingPromise;
  }

  function getSubjectDisplayName(
    subjectType?: string,
    subjectId?: string,
  ): string {
    if (!subjectId) return '-';

    const normalizedId = subjectId.trim();

    // 预置特殊标识
    if (normalizedId.toUpperCase() === 'ANONYMOUS') {
      return '匿名访客';
    }
    if (normalizedId.toUpperCase() === 'SUPER_ADMIN' || normalizedId === '1') {
      return (
        userMap.value.get('1') ?? userMap.value.get('admin') ?? '超级管理员'
      );
    }
    if (normalizedId.toUpperCase() === 'TENANT_ADMIN') {
      return '租户管理员';
    }

    if (subjectType === 'HUMAN') {
      const found = userMap.value.get(normalizedId);
      if (found) return found;
      return `用户 (${normalizedId})`;
    }

    if (subjectType === 'DEPARTMENT') {
      const found = deptMap.value.get(normalizedId);
      if (found) return found;
      return `部门 (${normalizedId})`;
    }

    if (subjectType === 'ROLE') {
      const found = roleMap.value.get(normalizedId);
      if (found) return found;
      return `角色 (${normalizedId})`;
    }

    // 尝试在各大 Map 中匹配
    const userMatch = userMap.value.get(normalizedId);
    if (userMatch) return userMatch;
    const deptMatch = deptMap.value.get(normalizedId);
    if (deptMatch) return deptMatch;
    const roleMatch = roleMap.value.get(normalizedId);
    if (roleMatch) return roleMatch;

    return normalizedId;
  }

  function isResolvedToName(subjectType?: string, subjectId?: string): boolean {
    if (!subjectId) return false;
    const normalizedId = subjectId.trim();
    if (
      ['1', 'admin', 'anonymous', 'super_admin', 'tenant_admin'].includes(
        normalizedId.toLowerCase(),
      )
    ) {
      return true;
    }
    if (subjectType === 'HUMAN' && userMap.value.has(normalizedId)) return true;
    if (subjectType === 'DEPARTMENT' && deptMap.value.has(normalizedId))
      return true;
    if (subjectType === 'ROLE' && roleMap.value.has(normalizedId)) return true;
    return false;
  }

  function getSubjectSelectOptions(targetType?: string): Array<{
    label: string;
    options?: Array<{ label: string; value: string }>;
    value?: string;
  }> {
    if (targetType === 'HUMAN') {
      return userListState.value.map((u) => {
        const namePart =
          u.nickName && u.userName && u.nickName !== u.userName
            ? `${u.nickName} (${u.userName})`
            : u.nickName || u.userName || `用户 ${u.userId}`;
        return {
          label: namePart,
          value: u.userId,
        };
      });
    }

    if (targetType === 'DEPARTMENT') {
      return deptListState.value.map((d) => ({
        label: d.name,
        value: d.id,
      }));
    }

    if (targetType === 'ROLE') {
      return roleListState.value.map((r) => ({
        label: r.roleKey ? `${r.roleName} (${r.roleKey})` : r.roleName,
        value: r.roleId,
      }));
    }

    if (targetType === 'SUPER_ADMIN') {
      const adminUser = userListState.value.find(
        (u) => u.userId === '1' || u.userName === 'admin',
      );
      const label = adminUser
        ? `${adminUser.nickName || '超级管理员'} (${adminUser.userName || 'admin'})`
        : '超级管理员 (1)';
      return [
        { label, value: '1' },
        { label: '超级管理员 (SUPER_ADMIN)', value: 'SUPER_ADMIN' },
      ];
    }

    if (targetType === 'TENANT_ADMIN') {
      return [{ label: '租户管理员 (TENANT_ADMIN)', value: 'TENANT_ADMIN' }];
    }

    if (targetType === 'SERVICE' || targetType === 'SERVICE_ACCOUNT') {
      return [{ label: '服务账号 (SERVICE)', value: 'SERVICE' }];
    }

    const groups: Array<{
      label: string;
      options: Array<{ label: string; value: string }>;
    }> = [];

    // 1. 用户分组（唯一去重）
    if (userListState.value.length > 0) {
      groups.push({
        label: '用户 (HUMAN)',
        options: userListState.value.map((u) => {
          const namePart =
            u.nickName && u.userName && u.nickName !== u.userName
              ? `${u.nickName} (${u.userName})`
              : u.nickName || u.userName || `用户 ${u.userId}`;
          return {
            label: namePart,
            value: u.userId,
          };
        }),
      });
    }

    // 2. 部门分组（唯一去重）
    if (deptListState.value.length > 0) {
      groups.push({
        label: '部门 (DEPARTMENT)',
        options: deptListState.value.map((d) => ({
          label: d.name,
          value: d.id,
        })),
      });
    }

    // 3. 角色分组（唯一去重）
    if (roleListState.value.length > 0) {
      groups.push({
        label: '角色 (ROLE)',
        options: roleListState.value.map((r) => ({
          label: r.roleKey ? `${r.roleName} (${r.roleKey})` : r.roleName,
          value: r.roleId,
        })),
      });
    }

    // 4. 特殊系统主体
    groups.push({
      label: '系统预置主体',
      options: [
        { label: '匿名访客 (ANONYMOUS)', value: 'ANONYMOUS' },
        { label: '租户管理员 (TENANT_ADMIN)', value: 'TENANT_ADMIN' },
      ],
    });

    return groups;
  }

  return {
    getSubjectDisplayName,
    getSubjectSelectOptions,
    isResolvedToName,
    loadSubjectData,
  };
}
