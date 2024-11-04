import { useState, useEffect, useRef } from 'react';
import './Filter.css';

const ListFilter = ({ targets, handler, text }) => {
  const [searchTerm, setSearchTerm] = useState(text);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const userInputRef = useRef(false); // Track if the input change was user-triggered

  // Filter targets based on the search term
  const filteredTargets = targets
    .filter(target => target.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const startsWithSearch = (str) => str.toLowerCase().startsWith(searchTerm.toLowerCase());
      return startsWithSearch(b) - startsWithSearch(a);
    });

  // Handle target selection
  const handleSelectTarget = (target) => {
    setSearchTerm(target);  // Set the input to the selected target
    handler(target);  // Call the handler with the selected target
    setDropdownVisible(false);  // Close the dropdown
    setFocusedIndex(-1);  // Reset focused index
    userInputRef.current = false; // Set userInputRef to false after programmatic change
  };

  // Handle key events for navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      setFocusedIndex((prevIndex) =>
        prevIndex < filteredTargets.length - 1 ? prevIndex + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      setFocusedIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : filteredTargets.length - 1
      );
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      handleSelectTarget(filteredTargets[focusedIndex]);
    } else if (e.key === 'Escape') {
      setDropdownVisible(false);
      setFocusedIndex(-1);
    }
  };

  // Update search term and trigger handler immediately
  const handleChange = (e) => {
    userInputRef.current = true; // Mark as user input
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    handler(newSearchTerm); // Trigger handler on every input change
  };

  // Show dropdown only if the change was triggered by user input
  useEffect(() => {
    if (userInputRef.current) {
      setDropdownVisible(searchTerm.length > 0 && filteredTargets.length > 0);
    }
  }, [searchTerm, filteredTargets.length]);

  return (
    <div className="filter-container"
      style={{ position: 'relative' }}>
      {/* Input field for searching */}
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={handleChange}  // Apply handler on every change
        onKeyDown={handleKeyDown}
        className="filter-input"
      />

      {/* Dropdown list */}
      {isDropdownVisible && (
        <div className="dropdown">
          {filteredTargets.map((target, index) => (
            <div
              key={index}
              className={`dropdown-item ${index === focusedIndex ? 'focused' : ''}`}
              onMouseDown={() => handleSelectTarget(target)}
            >
              {target}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListFilter;
