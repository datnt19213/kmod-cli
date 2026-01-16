
/* ============================================================
   RBAC FINAL – BACKEND + FRONTEND – SINGLE FILE
   ============================================================ */

/* =======================
   REACT HELPERS (OPTIONAL)
   ======================= */
import React, {
  createContext,
  useContext,
} from 'react';

/* =======================
   SHARED CONCEPT
   ======================= */
export type ID = string;
/**
 * @example "read"
 */
export type Action = string;
/**
 * @description Resource is route name
 * @example "user"
 */
export type Resource = string;
/**
 * @example "user:read"
 */
export type PermissionKey = `${Resource}:${Action}`;

/* =======================
   BACKEND RBAC (AUTHORITATIVE)
   ======================= */

export interface Permission {
  id: ID;
  action: Action;
  resource: Resource;
}

export interface Role {
  id: ID;
  name: string;
  permissions: ID[];
  inherits?: ID[];
}

export type ConditionOperator = 'eq' | 'ne' | 'in';

export interface Condition {
  field: string; // "user.id", "resource.ownerId", "user.tenantId"
  op: ConditionOperator;
  value: any;
}

export interface Policy {
  id: ID;
  permissionId: ID;
  effect: 'allow' | 'deny';
  conditions?: Condition[];
}

export interface UserIdentity {
  id: ID;
  roles: ID[];
  tenantId?: ID;
  [k: string]: any;
}

/* =======================
   RBAC STORE INTERFACE
   ======================= */
export interface RBACStore {
  getRoles(ids: ID[]): Promise<Role[]>;
  getPermissionId(action: Action, resource: Resource): Promise<ID | null>;
  getPolicies(permissionId: ID): Promise<Policy[]>;
}

/* =======================
   BACKEND RBAC ENGINE
   ======================= */

const getByPath = (obj: any, path: string) =>
  path.split('.').reduce((o, k) => o?.[k], obj);

const evalCondition = (cond: Condition, ctx: any) => {
  const left = getByPath(ctx, cond.field);
  if (cond.op === 'eq') return left === cond.value;
  if (cond.op === 'ne') return left !== cond.value;
  if (cond.op === 'in') return Array.isArray(cond.value) && cond.value.includes(left);
  return false;
};

const evalConditions = (conds: Condition[] = [], ctx: any) =>
  conds.every(c => evalCondition(c, ctx));

export async function canAccess(
  store: RBACStore,
  user: UserIdentity,
  action: Action,
  resource: Resource,
  context: {
    resource?: any;
    request?: any;
  } = {}
): Promise<boolean> {
  const permissionId = await store.getPermissionId(action, resource);
  if (!permissionId) return false;

  /* ---- Resolve role inheritance ---- */
  const visited = new Set<ID>();
  const collect = async (roleId: ID) => {
    if (visited.has(roleId)) return;
    visited.add(roleId);
    const [role] = await store.getRoles([roleId]);
    for (const p of role?.inherits ?? []) await collect(p);
  };
  for (const r of user.roles) await collect(r);

  const roles = await store.getRoles([...visited]);
  const hasRoleGrant = roles.some(r => r.permissions.includes(permissionId));

  /* ---- Evaluate policies ---- */
  const policies = await store.getPolicies(permissionId);
  const ctx = {
    user,
    resource: context.resource,
    request: context.request,
  };

  for (const p of policies) {
    if (!evalConditions(p.conditions, ctx)) continue;
    if (p.effect === 'deny') return false;
    if (p.effect === 'allow') return hasRoleGrant;
  }

  return hasRoleGrant;
}

/* =======================
   BACKEND MIDDLEWARE
   ======================= */

export const requirePermission =
  (store: RBACStore, action: Action, resource: Resource) =>
  async (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).end();

    const ok = await canAccess(store, req.user, action, resource, {
      resource: req.body ?? req.params,
      request: req,
    });

    if (!ok) return res.status(403).end();
    next();
  };

/* =======================
   MEMORY STORE (DEV / DEMO)
   ======================= */

export function createMemoryRBACStore(data: {
  roles: Role[];
  permissions: Permission[];
  policies: Policy[];
}): RBACStore {
  const roleMap = new Map(data.roles.map(r => [r.id, r]));
  const permMap = new Map<PermissionKey, ID>();
  const policyMap = new Map<ID, Policy[]>();

  data.permissions.forEach(p =>
    permMap.set(`${p.resource}:${p.action}`, p.id)
  );

  data.policies.forEach(p => {
    const arr = policyMap.get(p.permissionId) ?? [];
    arr.push(p);
    policyMap.set(p.permissionId, arr);
  });

  return {
    getRoles: async ids => ids.map(id => roleMap.get(id)!).filter(Boolean),
    getPermissionId: async (a, r) => permMap.get(`${r}:${a}`) ?? null,
    getPolicies: async pid => policyMap.get(pid) ?? [],
  };
}

/* =======================
   FRONTEND RBAC (UI ONLY)
   ======================= */

export class FrontendRBAC {
  private permissions: Set<PermissionKey>;

  constructor(perms: PermissionKey[]) {
    this.permissions = new Set(perms);
  }

  can(action: Action, resource: Resource): boolean {
    return this.permissions.has(`${resource}:${action}`);
  }
}

const RBACContext = createContext<FrontendRBAC | null>(null);

export const RBACProvider = ({
  rbac,
  children,
}: {
  rbac: FrontendRBAC;
  children: React.ReactNode;
}) => (
  <RBACContext.Provider value={rbac}>
    {children}
  </RBACContext.Provider>
);

export const useCan = (action: Action, resource: Resource) => {
  const rbac = useContext(RBACContext);
  return rbac?.can(action, resource) ?? false;
};

export const Can = ({
  action,
  resource,
  children,
  fallback = null,
}: any) => {
  const ok = useCan(action, resource);
  return ok ? children : fallback;
};


// fully usage fe

// const rbac = new FrontendRBAC(['user:read', 'user:update']);
// const store = createMemoryRBACStore({
//   roles: [],
//   permissions: [],
//   policies: [],
// });

// <RBACProvider rbac={rbac}>
//   <Can action="user:read" resource="user">
//     <div>Can read user</div>
//   </Can>
// </RBACProvider>

// fully usage be

// import { requirePermission } from './rbac';
// router.use(requirePermission(store, 'read', 'user'));

// app.use(requirePermission(store, 'read', 'user'));