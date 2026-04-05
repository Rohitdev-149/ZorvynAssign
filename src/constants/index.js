/**
 * Application-wide constants.
 * Centralised here to avoid magic strings scattered across the codebase.
 */

// ── User Roles ──────────────────────────────────────────────────────────
const ROLES = Object.freeze({
  VIEWER: 'viewer',
  ANALYST: 'analyst',
  ADMIN: 'admin',
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

// ── User Status ─────────────────────────────────────────────────────────
const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

// ── Financial Record Types ──────────────────────────────────────────────
const RECORD_TYPES = Object.freeze({
  INCOME: 'income',
  EXPENSE: 'expense',
});

// ── Default Pagination ──────────────────────────────────────────────────
const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
});

// ── HTTP Status Codes (commonly used) ───────────────────────────────────
const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER: 500,
});

module.exports = {
  ROLES,
  ALL_ROLES,
  USER_STATUS,
  RECORD_TYPES,
  PAGINATION,
  HTTP_STATUS,
};
