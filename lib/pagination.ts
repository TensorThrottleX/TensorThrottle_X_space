// Shared pagination constants — single source of truth for feed pagination.
// Cursor math (initial cursor, next cursor, page size) must derive from these;
// never hardcode page sizes or cursor values in consumers.

export const POSTS_PER_PAGE = 6

export const MAX_PAGE_LIMIT = 50
