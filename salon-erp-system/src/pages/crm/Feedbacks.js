import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import "../settings/users.css";
//import { Bell } from "lucide-react";
import { FaSync } from "react-icons/fa";
import { feedbackApi, branchApi } from '../../utils/api';

const Feedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const user = JSON.parse(localStorage.getItem('user'));
  const userRole = user?.role || '';
  const userBranchId = user?.branchId ? parseInt(user.branchId) : null;
  const isAdmin = userRole.toLowerCase() === 'admin';
  const [currentBranch, setCurrentBranch] = useState(isAdmin ? null : userBranchId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!isAdmin && userBranchId) {
          setCurrentBranch(userBranchId);
        }

        const [branchesRes, feedbacksRes] = await Promise.all([
          branchApi.getAll(),
          feedbackApi.getAll(currentBranch ? { branchId: currentBranch } : {})
        ]);

        setBranches(branchesRes.data || branchesRes);
        setFeedbacks(feedbacksRes.data || feedbacksRes);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentBranch, isAdmin, userBranchId]);

  const handleBranchChange = (branchId) => {
    setCurrentBranch(branchId ? parseInt(branchId) : null);
  };

  const refreshData = async () => {
    try {
      setIsLoading(true);
      const params = currentBranch ? { branchId: currentBranch } : {};
      const res = await feedbackApi.getAll(params);
      setFeedbacks(res.data || res);
      setError(null);
    } catch (err) {
      setError('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  const renderBranchSelector = () => {
    if (!isAdmin) {
      const userBranch = branches.find(b => b.branch_id === userBranchId);
      return (
        <div className="branch-selector">
          <label>Branch: </label>
          <input
            type="text"
            value={userBranch?.branch_name || (userBranchId ? `Branch ID: ${userBranchId}` : 'None')}
            readOnly
          />
        </div>
      );
    }
    
    return (
      <div className="branch-selector">
        <label>Branch: </label>
        <select
          value={currentBranch || ''}
          onChange={(e) => handleBranchChange(e.target.value)}
        >
          <option value="">All Branches</option>
          {branches.map(branch => (
            <option key={branch.branch_id} value={branch.branch_id}>
              {branch.branch_name}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderRatingStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="users-container">
      <Sidebar />
      <div className="users-content">
        {/* Header remains the same */}

        <div className="user-management-wrapper">
          <div className="header-container">
            <h2>Feedback List</h2>
            <div className="branch-controls">
              {renderBranchSelector()}
              <button className="refresh-btn" onClick={refreshData}>
                <FaSync /> Refresh
              </button>
            </div>
          </div>

          {/* Error and loading states */}

          <div className="user-list-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  {isAdmin && <th>Branch</th>}
                  <th>Rating</th>
                  <th>Comments</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.length > 0 ? (
                  feedbacks.map((fb, index) => (
                    <tr key={fb.feedback_id}>
                      <td>{index + 1}</td>
                      <td>{fb.customer_name || `Customer #${fb.customer_id}`}</td>
                      {isAdmin && <td>{fb.branch_name || 'N/A'}</td>}
                      <td title={`${fb.rating}/5`}>{renderRatingStars(fb.rating)}</td>
                      <td>{fb.comments || 'No comments'}</td>
                      <td>{new Date(fb.feedback_date).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="no-data">
                      {isLoading ? 'Loading...' : 'No feedbacks found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedbacks;