import React from "react";

const SearchBar = ({ searchTerm, onSearchTermChange }) => {
  return (
    <div className="mb-4 relative">
      <input
        type="text"
        placeholder="Search medicines by name..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className="w-full px-4 py-3 pl-10 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-shadow duration-200 ease-in-out"
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      {/* Optional: Search button if not fully debounced or if explicit action is preferred */}
      {/* <button 
        onClick={() => console.log('Explicit search for:', searchTerm)}
        className='absolute inset-y-0 right-0 pr-3 flex items-center text-blue-600 hover:text-blue-800'>
        Search
      </button> */}
    </div>
  );
};

export default SearchBar;
