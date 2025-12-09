# AllUsers.jsx - City & Plant Type Filters Implementation

## Summary
Added two new filters (City and Plant Type) to the AllUsers table with proper filtering logic, UI components, and plant type label display.

---

## PART 1: NEW STATES

**Location:** Lines 66-79

```javascript
// City filter states
const [selectedCity, setSelectedCity] = useState("");
const [cityList, setCityList] = useState([]);
const [isCityFilterOpen, setIsCityFilterOpen] = useState(false);
const [cityFilterMenuPos, setCityFilterMenuPos] = useState({ top: 0, left: 0 });
const cityFilterButtonRef = useRef(null);
const cityFilterMenuRef = useRef(null);

// Plant type filter states
const [selectedPlantType, setSelectedPlantType] = useState("");
const [isPlantTypeFilterOpen, setIsPlantTypeFilterOpen] = useState(false);
const [plantTypeFilterMenuPos, setPlantTypeFilterMenuPos] = useState({ top: 0, left: 0 });
const plantTypeFilterButtonRef = useRef(null);
const plantTypeFilterMenuRef = useRef(null);
```

---

## PART 2: PLANT TYPE LABEL HELPER

**Location:** Lines 154-160

```javascript
// Plant type label helper
function getPlantTypeLabel(v) {
  if (v == 0) return "Solar System";
  if (v == 1) return "Battery Storage";
  if (v == 2) return "Solar with Limitation";
  return "N/A";
}
```

---

## PART 3: CITY FILTER HANDLERS

**Location:** Lines 162-189

```javascript
// City filter handlers
const updateCityFilterMenuPosition = useCallback(() => {
  if (typeof window === "undefined" || !cityFilterButtonRef.current) return;
  const rect = cityFilterButtonRef.current.getBoundingClientRect();
  setCityFilterMenuPos({
    top: rect.bottom + window.scrollY + 8,
    left: rect.left + window.scrollX,
  });
}, []);

const closeCityFilterMenu = useCallback(() => {
  setIsCityFilterOpen(false);
}, []);

const handleCityFilterIconClick = () => {
  if (isCityFilterOpen) {
    closeCityFilterMenu();
  } else {
    updateCityFilterMenuPosition();
    setIsCityFilterOpen(true);
  }
};

const handleCityFilterSelect = (value) => {
  setSelectedCity(value);
  setTablePage(1);
  closeCityFilterMenu();
};
```

---

## PART 4: PLANT TYPE FILTER HANDLERS

**Location:** Lines 191-218

```javascript
// Plant type filter handlers
const updatePlantTypeFilterMenuPosition = useCallback(() => {
  if (typeof window === "undefined" || !plantTypeFilterButtonRef.current) return;
  const rect = plantTypeFilterButtonRef.current.getBoundingClientRect();
  setPlantTypeFilterMenuPos({
    top: rect.bottom + window.scrollY + 8,
    left: rect.left + window.scrollX,
  });
}, []);

const closePlantTypeFilterMenu = useCallback(() => {
  setIsPlantTypeFilterOpen(false);
}, []);

const handlePlantTypeFilterIconClick = () => {
  if (isPlantTypeFilterOpen) {
    closePlantTypeFilterMenu();
  } else {
    updatePlantTypeFilterMenuPosition();
    setIsPlantTypeFilterOpen(true);
  }
};

const handlePlantTypeFilterSelect = (value) => {
  setSelectedPlantType(value);
  setTablePage(1);
  closePlantTypeFilterMenu();
};
```

---

## PART 5: CITY LIST GENERATION

**Location:** Lines 1168-1173

```javascript
// Generate unique city list from displayed users
useEffect(() => {
  const all = displayedUsers.map(u => u.city_name).filter(Boolean);
  const unique = [...new Set(all)].sort();
  setCityList(unique);
}, [displayedUsers]);
```

---

## PART 6: FILTERING LOGIC

**Location:** Lines 1129-1151

```javascript
// Apply city filter
const cityFilteredUsers = selectedCity
  ? filteredUsers.filter(u => u.city_name === selectedCity)
  : filteredUsers;

// Apply plant type filter
const plantTypeFilteredUsers = selectedPlantType !== ""
  ? cityFilteredUsers.filter(u => String(u.plant_type) === String(selectedPlantType))
  : cityFilteredUsers;

const totalTablePages = Math.max(
  1,
  Math.ceil(plantTypeFilteredUsers.length / rowsPerPage)
);
const rowStartIndex = (tablePage - 1) * rowsPerPage;
const paginatedUsers = plantTypeFilteredUsers.slice(
  rowStartIndex,
  rowStartIndex + rowsPerPage
);
// Apply inverter filter to paginated results
const inverterFilteredUsers = selectedInverter
  ? paginatedUsers.filter((u) => u.inverter_type === selectedInverter)
  : paginatedUsers;
```

---

## PART 7: CITY FILTER MENU

**Location:** Lines 1227-1268

```javascript
// City filter menu
const cityFilterMenu =
  isCityFilterOpen && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={cityFilterMenuRef}
          className="inverter-filter-menu"
          style={{
            top: cityFilterMenuPos.top,
            left: cityFilterMenuPos.left,
          }}
        >
          <div className="filter-menu-header">City</div>
          <button
            type="button"
            className={`filter-menu-option ${
              selectedCity === "" ? "active" : ""
            }`}
            onClick={() => handleCityFilterSelect("")}
          >
            Show All
          </button>
          <div className="filter-menu-divider" />
          {cityList.map((city) => (
            <button
              key={city}
              type="button"
              className={`filter-menu-option ${
                selectedCity === city ? "active" : ""
              }`}
              onClick={() => handleCityFilterSelect(city)}
            >
              {city}
              {selectedCity === city && (
                <span className="filter-menu-check">✓</span>
              )}
            </button>
          ))}
        </div>,
        document.body
      )
    : null;
```

---

## PART 8: PLANT TYPE FILTER MENU

**Location:** Lines 1270-1315

```javascript
// Plant type filter menu
const plantTypeFilterMenu =
  isPlantTypeFilterOpen && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={plantTypeFilterMenuRef}
          className="inverter-filter-menu"
          style={{
            top: plantTypeFilterMenuPos.top,
            left: plantTypeFilterMenuPos.left,
          }}
        >
          <div className="filter-menu-header">Plant Type</div>
          <button
            type="button"
            className={`filter-menu-option ${
              selectedPlantType === "" ? "active" : ""
            }`}
            onClick={() => handlePlantTypeFilterSelect("")}
          >
            Show All
          </button>
          <div className="filter-menu-divider" />
          {[
            { label: "Solar System", value: "0" },
            { label: "Battery Storage", value: "1" },
            { label: "Solar with Limitation", value: "2" },
          ].map((type) => (
            <button
              key={type.value}
              type="button"
              className={`filter-menu-option ${
                selectedPlantType === type.value ? "active" : ""
              }`}
              onClick={() => handlePlantTypeFilterSelect(type.value)}
            >
              {type.label}
              {selectedPlantType === type.value && (
                <span className="filter-menu-check">✓</span>
              )}
            </button>
          ))}
        </div>,
        document.body
      )
    : null;
```

---

## PART 9: CITY COLUMN HEADER WITH FILTER

**Location:** Lines 1519-1547

```jsx
<th className="relative col-city">
  <div className="inverter-header">
    <SortableHeader label="City" field="city_name" />

    <button
      type="button"
      ref={cityFilterButtonRef}
      className={`inverter-filter-trigger ${
        isCityFilterOpen ? "active" : ""
      } ${selectedCity ? "has-selection" : ""}`}
      aria-label="Filter city"
      aria-expanded={isCityFilterOpen}
      onClick={handleCityFilterIconClick}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M4 5H20M7 12H17M10 19H14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>

    {selectedCity && (
      <span className="inverter-filter-chip">{selectedCity}</span>
    )}
  </div>
</th>
```

---

## PART 10: PLANT TYPE COLUMN HEADER WITH FILTER

**Location:** Lines 1560-1588

```jsx
<th className="relative col-plant-type">
  <div className="inverter-header">
    <SortableHeader label="Plant Type" field="plant_type" />

    <button
      type="button"
      ref={plantTypeFilterButtonRef}
      className={`inverter-filter-trigger ${
        isPlantTypeFilterOpen ? "active" : ""
      } ${selectedPlantType ? "has-selection" : ""}`}
      aria-label="Filter plant type"
      aria-expanded={isPlantTypeFilterOpen}
      onClick={handlePlantTypeFilterIconClick}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M4 5H20M7 12H17M10 19H14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>

    {selectedPlantType && (
      <span className="inverter-filter-chip">{getPlantTypeLabel(parseInt(selectedPlantType))}</span>
    )}
  </div>
</th>
```

---

## PART 11: PLANT TYPE TABLE CELL

**Location:** Line 1656

```jsx
<td>{getPlantTypeLabel(u.plant_type)}</td>
```

---

## PART 12: EVENT LISTENERS FOR CITY FILTER

**Location:** Lines 1089-1116

```javascript
// City filter menu event listeners
useEffect(() => {
  if (!isCityFilterOpen) return;

  const handleClickOutside = (event) => {
    if (
      cityFilterButtonRef.current?.contains(event.target) ||
      cityFilterMenuRef.current?.contains(event.target)
    ) {
      return;
    }
    closeCityFilterMenu();
  };

  const handleViewportChange = () => {
    updateCityFilterMenuPosition();
  };

  document.addEventListener("mousedown", handleClickOutside);
  window.addEventListener("scroll", handleViewportChange, true);
  window.addEventListener("resize", handleViewportChange);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
    window.removeEventListener("scroll", handleViewportChange, true);
    window.removeEventListener("resize", handleViewportChange);
  };
}, [isCityFilterOpen, closeCityFilterMenu, updateCityFilterMenuPosition]);
```

---

## PART 13: EVENT LISTENERS FOR PLANT TYPE FILTER

**Location:** Lines 1118-1145

```javascript
// Plant type filter menu event listeners
useEffect(() => {
  if (!isPlantTypeFilterOpen) return;

  const handleClickOutside = (event) => {
    if (
      plantTypeFilterButtonRef.current?.contains(event.target) ||
      plantTypeFilterMenuRef.current?.contains(event.target)
    ) {
      return;
    }
    closePlantTypeFilterMenu();
  };

  const handleViewportChange = () => {
    updatePlantTypeFilterMenuPosition();
  };

  document.addEventListener("mousedown", handleClickOutside);
  window.addEventListener("scroll", handleViewportChange, true);
  window.addEventListener("resize", handleViewportChange);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
    window.removeEventListener("scroll", handleViewportChange, true);
    window.removeEventListener("resize", handleViewportChange);
  };
}, [isPlantTypeFilterOpen, closePlantTypeFilterMenu, updatePlantTypeFilterMenuPosition]);
```

---

## PART 14: FILTER MENUS IN RETURN STATEMENT

**Location:** Lines 1803-1805

```jsx
{filterMenu}
{cityFilterMenu}
{plantTypeFilterMenu}
```

---

## Key Features

✅ **City Filter**
- Dynamically generates list from displayed users
- Sorted alphabetically
- Same UI as Inverter Type filter
- Resets pagination on selection

✅ **Plant Type Filter**
- Three options: Solar System, Battery Storage, Solar with Limitation
- Same UI as Inverter Type filter
- Displays label in filter chip
- Resets pagination on selection

✅ **Plant Type Display**
- Table cell shows human-readable labels instead of numeric values
- Helper function handles all conversions

✅ **Filtering Order**
- Search → Sort → City Filter → Plant Type Filter → Inverter Filter → Pagination
- Proper data flow with correct array references

✅ **No Styling Changes**
- Uses existing CSS classes
- Matches Inverter Type filter UI exactly

---

## Data Flow

```
displayedUsers (from status tab)
    ↓
filteredUsersRaw (search filter)
    ↓
filteredUsers (sorted)
    ↓
cityFilteredUsers (city filter)
    ↓
plantTypeFilteredUsers (plant type filter)
    ↓
paginatedUsers (pagination)
    ↓
inverterFilteredUsers (inverter filter - display only)
```
