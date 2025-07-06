import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AutocompleteInput = ({ 
  id, 
  value, 
  onChange, 
  options, 
  placeholder,
  icon 
}) => {
  const navigate = useNavigate();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const handleInputClick = () => {
    // Input'a tıklandığında değeri sıfırla
    setSearchTerm('');
    onChange({ target: { name: id, value: '' } });
    setShowSuggestions(true);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange({ target: { name: id, value: newValue } });
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.value);
    onChange({ target: { name: id, value: suggestion.value } });
    setShowSuggestions(false);
  };

  const handleClickOutside = (e) => {
    if (inputRef.current && !inputRef.current.contains(e.target)) {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleIconClick = (e) => {
    e.stopPropagation(); // Prevent the input click handler from firing
    navigate('/companyAgencyDashboard/definitions/tours/lists');
  };

  const filteredOptions = options.filter(option =>
    option.searchTerms?.includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="position-relative" ref={inputRef}>
      <div className="input-group">
        {icon && (
          <span 
            className="input-group-text" 
            onClick={handleIconClick}
            style={{ cursor: 'pointer' }}
          >
            <i className={`bi ${icon}`}></i>
          </span>
        )}
        <input
          type="text"
          className="form-control"
          value={searchTerm}
          onChange={handleInputChange}
          onClick={handleInputClick}
          placeholder={placeholder}
        />
      </div>
      
      {showSuggestions && searchTerm && (
        <div className="position-absolute w-100 mt-1 shadow bg-white rounded border" 
             style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              className="px-3 py-2 cursor-pointer hover-bg-light"
              onClick={() => handleSuggestionClick(option)}
              style={{ cursor: 'pointer' }}
              onMouseEnter={e => e.target.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput; 