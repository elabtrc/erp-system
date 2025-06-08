import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import "../settings/users.css";
import { FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
// import { Bell } from "lucide-react";
import { stockApi } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const Stocks = () => {
  const { user, loading: authLoading } = useAuth(); // ✅ include authLoading
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [newStock, setNewStock] = useState({ 
    product_id: "", 
    branch_id: "", 
    quantity: "" 
  });
  const [editingStock, setEditingStock] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockQuantity, setRestockQuantity] = useState(0);
  const [selectedStockForRestock, setSelectedStockForRestock] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const isBranchManager = user?.role?.toLowerCase() === "branch manager";
  const isAccountant = user?.role?.toLowerCase() === "accountant";

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
  
        let response;
        if (isAdmin) {
          response = await axios.get('/api/stocks');
        } else {
          response = await axios.get(`/api/stocks/branch/${user.branchId}`); // 🔥 FIX HERE
        }
  
        setStocks(response.data || []);
      } catch (error) {
        console.error('Error fetching stocks:', error);
        setError(error.response?.data?.error || 'Failed to fetch stocks');
      } finally {
        setLoading(false);
      }
    };
  
    if (!authLoading && user) {
      fetchStocks();   // 🔥 CALL fetchStocks
    }
  }, [user, authLoading, isAdmin]);
  
  useEffect(() => {
    const fetchProductsAndBranches = async () => {
      try {
        const token = localStorage.getItem("token");
  
        const [productRes, branchRes] = await Promise.all([
          axios.get("/api/products", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/api/branches", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
  
        setProducts(productRes.data?.data || []);
        setBranches(branchRes.data || []);
      } catch (error) {
        console.error("Failed to load products or branches:", error);
        setError("Error loading product or branch data.");
      }
    };
  
    if (!authLoading && user) {
      fetchProductsAndBranches();
    }
  }, [user, authLoading]);
  
  
  


  const fetchStocksByBranch = async (branchId) => {
    try {
      setLoading(true);
      const response = branchId 
        ? await stockApi.getByBranch(branchId)
        : await stockApi.getAll();
      setStocks(response || []); // <-- fix here
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stocks by branch:', err);
      setError(err.message || "Failed to load stocks.");
      setLoading(false);
    }
  };
  
  
  useEffect(() => {
    console.log("Current stocks:", stocks);
  }, [stocks]);
  

  const handleAddOrUpdateStock = async () => {
    if (!newStock.product_id || !newStock.branch_id || newStock.quantity <= 0) {
      setError("Please fill all required fields");
      return;
    }
  
    try {
      if (editingStock) {
        await stockApi.update(editingStock.id, { quantity: newStock.quantity });
      } else {
        await stockApi.create(newStock); // attempt to add stock
      }
  
      await fetchStocksByBranch(selectedBranch);
      resetForm();
      setIsModalOpen(false);
      setError(null);
    } catch (err) {
      const backendMessage = err.response?.data?.error;
    
      if (
        backendMessage &&
        backendMessage.includes("not registered for the selected branch")
      ) {
        const shouldAdd = window.confirm(
          "This product is not in this branch’s product list. Would you like to add it?"
        );
    
        if (shouldAdd) {
          try {
            const token = localStorage.getItem("token");
            await axios.post(
              "/api/stocks/add-product-to-branch",
              {
                product_id: newStock.product_id,
                branch_id: newStock.branch_id,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
    
            await stockApi.create(newStock);
            await fetchStocksByBranch(selectedBranch);
            resetForm();
            setIsModalOpen(false);
            setError(null);
            return;
          } catch (autoAddErr) {
            console.error("Auto-adding product to branch failed:", autoAddErr);
            window.alert("Failed to auto-add product to branch.");
            return;
          }
        } else {
          window.alert("Stock not added because the product must first exist in the branch’s product list.");
        }
      } else {
        window.alert(backendMessage || err.message || "Something went wrong.");
      }
    }    
  };
  

  const handleDeleteStock = async (id) => {
    try {
      await stockApi.delete(id);
      await fetchStocksByBranch(selectedBranch);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditStock = (stock) => {
    setEditingStock(stock);
    setNewStock({
      product_id: stock.product_id,
      branch_id: stock.branch_id,
      quantity: stock.quantity
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setNewStock({ 
      product_id: "", 
      branch_id: user?.branchId || "",  // ✅ Correct
      quantity: "" 
    });
    setEditingStock(null);
    setError(null);
  };

  const handleRequestRestock = (stock) => {
    setSelectedStockForRestock(stock);
    setRestockQuantity(0);
    setIsRestockModalOpen(true);
    console.log("Selected stock for restock:", stock);

  };

  const handleSubmitRestockRequest = async () => {
    if (!restockQuantity || restockQuantity <= 0) {
      setError("Please enter a valid restock quantity.");
      return;
    }
  
    const stock = selectedStockForRestock;
  
    if (!stock || !stock.product_id || !stock.branch_id) {
      setError("Missing product or branch information.");
      return;
    }
  
    const token = localStorage.getItem("token");
    console.log("Submitting restock with:", {
      product_id: stock.product_id,
      branch_id: stock.branch_id,
      current_quantity: stock.quantity,
      requested_quantity: restockQuantity,
      requested_by: user?.userId
    });
    
  
    try {
      await axios.post("/api/restock-requests", {
        product_id: stock.product_id,
        branch_id: stock.branch_id,
        current_quantity: stock.quantity,
        requested_quantity: restockQuantity,
        requested_by: user?.user_id  // 🔥 corrected to user_id
      }, { headers: { Authorization: `Bearer ${token}` } });
      
  
      setIsRestockModalOpen(false);
      setSelectedStockForRestock(null);
      setRestockQuantity(0);
      setError(null);
      alert("Restock request submitted successfully!");
    } catch (err) {
      console.error("Error submitting restock request:", err);
      setError(err.response?.data?.error || "Failed to submit restock request");
    }
  };
  

  const getStockStatus = (quantity) => {
    if (quantity < 20) return "Low";
    if (quantity < 50) return "Medium";
    return "High";
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.product_id === productId);
    return product ? product.product_name : "Unknown Product";
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.branch_id === branchId);
    return branch ? branch.branch_name : "Unknown Branch";
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["ID", "Branch", "Product", "Quantity", "Status", "Last Updated"],
      ...stocks.map((stock, index) => [
        index + 1,
        getBranchName(stock.branch_id),
        getProductName(stock.product_id),
        stock.quantity,
        getStockStatus(stock.quantity),
        new Date(stock.last_updated).toLocaleString()
      ])
    ]
    .map(e => e.join(","))
    .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "stocks.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>

  return (
    <div className="users-container">
      <Sidebar />
      <div className="users-content">
        <div className="users-header">
          <h1>Stocks Management</h1>
          <div className="icon-1">
            {/* <Bell className="icon" /> */}
            <div className="user-avatar"></div>
          </div>
        </div>

        <div className="user-management-wrapper">
          <div className="header-container">
            <h2>Stocks</h2>

            {isAdmin && (
              <button className="add-user-btn" onClick={() => setIsModalOpen(true)}>
                <FaPlus /> Add New Stock
              </button>
            )}
          </div>

          <div className="controls-bar">
            {isAdmin && (
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  fetchStocksByBranch(e.target.value);
                }}
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            )}

<button className="export-btn" onClick={handleExportCSV}>
  Export to CSV
</button>

            <input
              type="text"
              placeholder="Search by Product"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="user-list-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  {isAdmin && <th>Branch</th>}
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
  {stocks
    .filter(stock =>
      (stock.product_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .map((stock, index) => (
      <tr key={stock.id}>
        <td>{index + 1}</td>
        {isAdmin && <td>{stock.branch_name}</td>}
        <td>{stock.product_name}</td>
        <td>{stock.quantity}</td>
        <td className={`status ${getStockStatus(stock.quantity).toLowerCase()}`}>
          {getStockStatus(stock.quantity)}
        </td>
        <td>{new Date(stock.last_updated).toLocaleString()}</td>
        <td>
                        {isAdmin && (
                          <>
                            <button className="edit-btn" onClick={() => handleEditStock(stock)}>
                              <FaEdit />
                            </button>
                            <button className="delete-btn" onClick={() => handleDeleteStock(stock.id)}>
                              <FaTrash />
                            </button>
                          </>
                        )}

                        {isBranchManager && (
                          <button className="restock-btn" onClick={() => handleRequestRestock(stock)}>
                            Request Restock
                          </button>
                        )}

                        {isAccountant && (
                          <span style={{ color: 'gray' }}>View Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Stock Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{editingStock ? "Edit Stock" : "Add Stock"}</h2>
                <button className="close-btn" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}

                <label>Product</label>
                <select
                  value={newStock.product_id}
                  onChange={(e) => setNewStock({ ...newStock, product_id: e.target.value })}
                  disabled={!!editingStock}
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.product_name}
                    </option>
                  ))}
                </select>

                {isAdmin && (
                  <>
                    <label>Branch</label>
                    <select
                      value={newStock.branch_id}
                      onChange={(e) => setNewStock({ ...newStock, branch_id: e.target.value })}
                      disabled={!!editingStock}
                    >
                      <option value="">Select Branch</option>
                      {branches.map(branch => (
                        <option key={branch.branch_id} value={branch.branch_id}>
                          {branch.branch_name}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                <label>Quantity</label>
                <input
  type="number"
  min="1"
  value={newStock.quantity}
  onChange={(e) => setNewStock({ ...newStock, quantity: Number(e.target.value) })}
  placeholder="Enter quantity"
/>



                <button onClick={handleAddOrUpdateStock}>
                  {editingStock ? <FaEdit /> : <FaPlus />} {editingStock ? "Update" : "Add"} Stock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Request Restock Modal */}
        {isRestockModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Request Restock</h2>
                <button className="close-btn" onClick={() => setIsRestockModalOpen(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}

                <label>Quantity to Request</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
                />

                <button onClick={handleSubmitRestockRequest}>
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Stocks;
