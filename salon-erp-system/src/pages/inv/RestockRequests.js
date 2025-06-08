import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../Sidebar";
import "../../styles/RestockRequests.css";

const RestockRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewHistory, setViewHistory] = useState(false);

  const token = localStorage.getItem("token");
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const url = viewHistory ? "/api/restock-requests/history" : "/api/restock-requests/pending";
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load restock requests");
      setLoading(false);
    }
  }, [viewHistory, token]);

  useEffect(() => {
    if (isAdmin) {
      fetchRequests();
    }
  }, [isAdmin, fetchRequests]);

  const handleConfirmRestock = async (id) => {
    try {
      await axios.put(`/api/restock-requests/${id}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRequests();
    } catch (err) {
      console.error("Confirm failed:", err);
    }
  };

  const handleRejectRestock = async (id) => {
    try {
      await axios.put(`/api/restock-requests/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRequests();
    } catch (err) {
      console.error("Reject failed:", err);
    }
  };

  if (!isAdmin) return <div>Unauthorized Access</div>;
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="users-container">
      <Sidebar />
      <div className="users-content">
        <h1>{viewHistory ? "Restock Request History" : "Pending Restock Requests"}</h1>

        <button 
          onClick={() => setViewHistory(!viewHistory)}
          className="toggle-button"
        >
          {viewHistory ? "View Pending Requests" : "View Request History"}
        </button>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Branch</th>
              <th>Quantity</th>
              <th>Status</th>
              {viewHistory ? (
                <>
                  <th>Requested By</th>
                  <th>Processed By</th>
                  <th>Processed At</th>
                  <th>Notes</th>
                </>
              ) : (
                <th>Actions</th>
              )}
            </tr>
          </thead>

          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{request.id}</td>
                <td>{request.product_name || `Product ${request.product_id}`}</td>
                <td>{request.branch_name || `Branch ${request.branch_id}`}</td>
                <td>{request.requested_quantity}</td>
                <td style={{ color: request.status === "approved" ? "green" : request.status === "rejected" ? "red" : "black" }}>
                  {request.status.toUpperCase()}
                </td>

                {viewHistory ? (
                  <>
                    <td>{request.requested_by_info || "-"}</td> {/* ✅ Combined Role - Branch */}
                    <td>{request.processed_by_username || "-"}</td>
                    <td>{request.processed_at ? new Date(request.processed_at).toLocaleString() : "-"}</td>
                    <td>{request.notes || "-"}</td>
                  </>
                ) : (
                  <td>
                    <button 
                      onClick={() => handleConfirmRestock(request.id)}
                      className="confirm-button"
                    >
                      Confirm
                    </button>
                    <button 
                      onClick={() => handleRejectRestock(request.id)}
                      className="reject-button"
                    >
                      Reject
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RestockRequests;
