# Pagination Updates - AllUsers.jsx and Company.jsx

## Summary of Changes

### 1. AllUsers.jsx - Fixed Entry Count Display

**Location:** Line 1527

**Changed from:**
```jsx
Showing {Math.min(rowStartIndex + 1, filteredUsers.length)} to {Math.min(rowStartIndex + rowsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
```

**Changed to:**
```jsx
Showing {Math.min(rowStartIndex + 1, inverterFilteredUsers.length)} to {Math.min(rowStartIndex + rowsPerPage, inverterFilteredUsers.length)} of {inverterFilteredUsers.length} entries
```

**Reason:** Uses the final rendered array (`inverterFilteredUsers`) which accounts for the inverter type filter, not just the search-filtered array.

---

### 2. Company.jsx - Added getPageNumbers Function

**Location:** Lines 428-476 (after handleTableNext)

```javascript
// Helper function to generate page numbers for pagination
const getPageNumbers = (currentPage, totalPages) => {
  const maxVisible = 5;
  const pages = [];

  if (totalPages <= maxVisible) {
    // Show all pages if total is less than max visible
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    // Calculate range around current page
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    // Adjust if near the beginning
    if (currentPage <= 2) {
      endPage = Math.min(totalPages - 1, 4);
    }

    // Adjust if near the end
    if (currentPage >= totalPages - 1) {
      startPage = Math.max(2, totalPages - 3);
    }

    // Add ellipsis if needed
    if (startPage > 2) {
      pages.push('...');
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add ellipsis if needed
    if (endPage < totalPages - 1) {
      pages.push('...');
    }

    // Always show last page
    pages.push(totalPages);
  }

  return pages;
};
```

---

### 3. Company.jsx - Replaced Pagination Component

**Location:** Lines 621-665

**Changed from:**
```jsx
<div className="ul-pagination">
  <button
    type="button"
    className="ul-btn"
    onClick={handleTablePrevious}
    disabled={tablePage === 1}
  >
    Previous
  </button>
  <div className="ul-pagination-info">
    Showing
    <span className="ul-strong">
      {sortedUsers.length === 0
        ? 0
        : `${rowStartIndex + 1}–${Math.min(
            rowStartIndex + paginatedUsers.length,
            sortedUsers.length
          )}`}
    </span>{" "}
    of <span className="ul-strong">{sortedUsers.length}</span>{" "}
    users • Page <span className="ul-strong">{tablePage}</span> of{" "}
    <span className="ul-strong">{totalTablePages}</span>
  </div>
  <button
    type="button"
    className="ul-btn"
    onClick={handleTableNext}
    disabled={tablePage === totalTablePages}
  >
    Next
  </button>
</div>
```

**Changed to:**
```jsx
<div className="ul-pagination">
  <div className="pagination-info">
    Showing {Math.min(rowStartIndex + 1, sortedUsers.length)} to {Math.min(rowStartIndex + rowsPerPage, sortedUsers.length)} of {sortedUsers.length} entries
  </div>
  <div className="pagination-controls">
    <button
      type="button"
      className="pagination-arrow-btn"
      onClick={handleTablePrevious}
      disabled={tablePage === 1}
      aria-label="Previous page"
    >
      ‹
    </button>
    <div className="pagination-numbers">
      {getPageNumbers(tablePage, totalTablePages).map((pageNum, idx) => (
        pageNum === '...' ? (
          <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
            {pageNum}
          </span>
        ) : (
          <button
            key={pageNum}
            type="button"
            className={`pagination-number ${
              tablePage === pageNum ? 'active' : ''
            }`}
            onClick={() => setTablePage(pageNum)}
          >
            {pageNum}
          </button>
        )
      ))}
    </div>
    <button
      type="button"
      className="pagination-arrow-btn"
      onClick={handleTableNext}
      disabled={tablePage === totalTablePages}
      aria-label="Next page"
    >
      ›
    </button>
  </div>
</div>
```

---

## Key Features

✅ **AllUsers.jsx**
- Entry count now reflects inverter filter (uses `inverterFilteredUsers.length`)
- Pagination shows accurate "X to Y of Z" entries

✅ **Company.jsx**
- Added `getPageNumbers()` function for smart page range display
- Replaced Previous/Next buttons with numeric pagination (‹ 1 2 3 4 5 ›)
- Entry count uses `sortedUsers.length` for accurate display
- Maintains `tablePage` state for pagination control
- Same styling and behavior as AllUsers.jsx pagination

✅ **No Layout Changes**
- Column alignment unchanged
- Table structure preserved
- All other functionality intact
