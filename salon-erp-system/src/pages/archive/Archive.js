import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import { FaFileAlt, FaSearch, FaPrint, FaUndo, FaArchive } from 'react-icons/fa';
// import { Bell } from 'lucide-react';
import '../settings/users.css';

const ArchiveModule = () => {
  // Sample archive data
  const [archiveData, setArchiveData] = useState([
    { id: 1, type: 'Product', name: 'Premium Shampoo', archivedAt: '2023-05-15', archivedBy: 'Admin User', reason: 'Discontinued', branch: '1' },
    { id: 2, type: 'User', name: 'John Smith', archivedAt: '2023-06-20', archivedBy: 'System', reason: 'Inactive account', branch: '1' },
    { id: 3, type: 'Service', name: 'Hair Coloring', archivedAt: '2023-04-10', archivedBy: 'Manager', reason: 'No longer offered', branch: '2' },
    { id: 4, type: 'Product', name: 'Conditioner', archivedAt: '2023-07-01', archivedBy: 'Admin User', reason: 'Low stock', branch: '3' },
    { id: 5, type: 'User', name: 'Sarah Johnson', archivedAt: '2023-03-15', archivedBy: 'Admin User', reason: 'Employee left', branch: '1' },
  ]);

  // Sample branch data
  const [branches] = useState([
    { id: 'all', name: 'All Branches' },
    { id: '1', name: 'Imus Branch' },
    { id: '2', name: 'Dasma Bayan Branch' },
    { id: '3', name: 'Molino Branch' },
    { id: '4', name: 'Lancaster Branch' }
  ]);

  const [selectedBranch, setSelectedBranch] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  // Filter archive records
  const filteredRecords = archiveData.filter(record => {
    const matchesBranch = selectedBranch === 'all' || record.branch === selectedBranch;
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         record.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || record.type === filterType;
    const matchesDate = new Date(record.archivedAt) >= new Date(dateRange.start) && 
                       new Date(record.archivedAt) <= new Date(dateRange.end);
    return matchesBranch && matchesSearch && matchesType && matchesDate;
  });

  // Toggle item selection
  const toggleItemSelection = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };

  // Select all items
  const selectAllItems = () => {
    if (selectedItems.length === filteredRecords.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredRecords.map(record => record.id));
    }
  };

  // Restore selected items
  const handleRestore = () => {
    // In a real app, this would call your API to restore items
    setArchiveData(prev => prev.filter(item => !selectedItems.includes(item.id)));
    setSelectedItems([]);
    setShowRestoreModal(false);
    // Show success notification
  };

  // Archive new items (mock function)
  const handleArchive = () => {
    // In a real app, this would call your API to archive items
    setShowArchiveModal(false);
    // Show success notification
  };

  return (
    <div className="users-container">
      <Sidebar />
      <div className="users-content">
        <div className="users-header">
          <h1>Archive Module</h1>
          <div className="icon-1">
            {/* <Bell className="icon" /> */}
            <div className="user-avatar"></div>
          </div>
        </div>

        <div className="user-management-wrapper">
          <div className="header-container">
            <h2>Archived Records</h2>
            <div className="finance-filters">
              <div className="search-bar">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search archived items..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Branch Filter */}
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="filter-select"
              >
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Types</option>
                <option value="Product">Products</option>
                <option value="User">Users</option>
                <option value="Service">Services</option>
              </select>
              
              <div className="date-filters">
                <label>From:</label>
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                />
                <label>To:</label>
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                />
              </div>
              
              <button className="print-btn" onClick={() => window.print()}>
                <FaPrint /> Print
              </button>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="btn-restore"
              disabled={selectedItems.length === 0}
              onClick={() => setShowRestoreModal(true)}
            >
              <FaUndo /> Restore Selected ({selectedItems.length})
            </button>
            <button 
              className="btn-archive"
              onClick={() => setShowArchiveModal(true)}
            >
              <FaArchive /> Archive Items
            </button>
          </div>

          <div className="user-list-container">
            <table className="archive-table">
              <thead>
                <tr>
                  <th>
                    <input 
                      type="checkbox" 
                      checked={selectedItems.length > 0 && selectedItems.length === filteredRecords.length}
                      onChange={selectAllItems}
                    />
                  </th>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Branch</th>
                  <th>Archived On</th>
                  <th>Archived By</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(record.id)}
                        onChange={() => toggleItemSelection(record.id)}
                      />
                    </td>
                    <td>{record.type}</td>
                    <td>{record.name}</td>
                    <td>{branches.find(b => b.id === record.branch)?.name || record.branch}</td>
                    <td>{new Date(record.archivedAt).toLocaleDateString()}</td>
                    <td>{record.archivedBy}</td>
                    <td>{record.reason}</td>
                    <td>
                      <button 
                        className="btn-restore-sm"
                        onClick={() => {
                          setSelectedItems([record.id]);
                          setShowRestoreModal(true);
                        }}
                      >
                        <FaUndo /> Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Restoration</h3>
            <p>Are you sure you want to restore {selectedItems.length} selected item(s)?</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowRestoreModal(false)}>Cancel</button>
              <button className="btn-confirm" onClick={handleRestore}>Confirm Restore</button>
            </div>
          </div>
        </div>
      )}

      {/* Archive New Items Modal */}
      {showArchiveModal && (
        <div className="modal-overlay">
          <div className="modal archive-modal">
            <h3>Archive Items</h3>
            <div className="form-group">
              <label>Type:</label>
              <select className="form-control">
                <option value="Product">Product</option>
                <option value="User">User</option>
                <option value="Service">Service</option>
              </select>
            </div>
            <div className="form-group">
              <label>Item to Archive:</label>
              <select className="form-control">
                <option value="">Select item...</option>
                <option value="1">Hair Treatment (Service)</option>
                <option value="2">Jane Doe (User)</option>
                <option value="3">Hair Spray (Product)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Reason:</label>
              <select className="form-control">
                <option value="Discontinued">Discontinued</option>
                <option value="Inactive">Inactive</option>
                <option value="No longer offered">No longer offered</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notes:</label>
              <textarea className="form-control" rows="3"></textarea>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowArchiveModal(false)}>Cancel</button>
              <button className="btn-confirm" onClick={handleArchive}>Archive Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveModule;