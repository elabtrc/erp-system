import React, { useState } from 'react';
import './Styles.css';

const BranchPanel = ({ branches, selectedBranch, onSelect }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSelectBranch = (branch) => {
    onSelect(branch);  // Ensure onSelect works as expected in parent
    setShowDropdown(false);  // Close dropdown after selecting a branch
  };

  return (
    <div className="branch-panel-container">
      <div className="branch-display-card">
        {selectedBranch ? (
          <>
            <div className="branch-image-container">
              <img 
                src={selectedBranch.image} 
                alt={selectedBranch.name}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x200?text=Salon+Branch';
                  e.target.onerror = null;
                }}
              />
            </div>
            <div className="branch-info">
              <h2>{selectedBranch.name}</h2>
              <p className="branch-location">{selectedBranch.location}</p>
              <p className="branch-schedule">{selectedBranch.schedule}</p>
            </div>
          </>
        ) : (
          <div className="branch-placeholder">
            <img 
              src="https://via.placeholder.com/300x200?text=Select+Branch" 
              alt="Select a branch"
            />
            <p>No branch selected</p>
          </div>
        )}
      </div>

      <div className="branch-selector">
        <button 
          className="branch-select-button"
          onClick={() => setShowDropdown(prev => !prev)}  // Toggle dropdown visibility
        >
          {selectedBranch ? 'Change Branch' : 'Select Branch'} 
          <span>{showDropdown ? '▲' : '▼'}</span>
        </button>

        {showDropdown && (
          <div className="branch-dropdown-menu">
            {branches.map(branch => (
              <div 
                key={branch.id}
                className={`branch-option ${selectedBranch?.id === branch.id ? 'selected' : ''}`} // Fixed className
                onClick={() => handleSelectBranch(branch)}  // Call handler to select branch
              >
                <img 
                  src={branch.image} 
                  alt={branch.name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/50x50?text=Branch';
                    e.target.onerror = null;
                  }}
                />
                <div className="branch-option-details">
                  <h4>{branch.name}</h4>
                  <p>{branch.location}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchPanel;
