import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import "./users.css";
import { FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
// import { Bell } from "lucide-react";
import { branchApi, userApi } from '../../utils/api';

const UserManagement = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const userBranchId = user?.branchId || null;

  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(userBranchId);

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    role_id: 2, // Default to Staff
    branch_id: userBranchId,
    is_active: true
  });

  const [editingUser, setEditingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const branchesRes = await branchApi.getAll();
        const usersRes = await userApi.getAll();
        setBranches(branchesRes.data || branchesRes);
        setUsers(usersRes.data || usersRes);
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    fetchData();
  }, []);

  const handleAddOrUpdateUser = async () => {
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.email.trim() || !newUser.first_name.trim() || !newUser.last_name.trim()) return;

    if (editingUser) {
      setUsers(users.map(user => 
        user.user_id === editingUser.user_id ? { ...editingUser, ...newUser } : user
      ));
      setEditingUser(null);
    } else {
      setUsers([...users, { user_id: Date.now(), ...newUser }]);
    }

    setNewUser({
      username: '',
      password: '',
      email: '',
      first_name: '',
      last_name: '',
      role_id: 2,
      branch_id: userBranchId,
      is_active: true
    });
    setIsModalOpen(false);
  };

  const handleDeleteUser = (id) => {
    setUsers(users.filter(user => user.user_id !== id));
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewUser({ ...user, password: "" });
    setIsModalOpen(true);
  };

  const filteredUsers = users.filter(user => {
    return !currentBranch || user.branch_id === currentBranch;
  });

  return (
    <div className="users-container">
      <Sidebar />
      <div className="users-content">
        <div className="users-header">
          <h1>User Management</h1>
          <div className="icon-1">
            {/* <Bell className="icon" /> */}
            <div className="user-avatar"></div>
          </div>
        </div>

        <div className="user-management-wrapper">
          <div className="header-container">
            <h2>Users</h2>

            <div className="branch-selector">
              <label>Branch:</label>
              <select value={currentBranch || ''} onChange={(e) => setCurrentBranch(parseInt(e.target.value) || null)}>
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch.branch_id} value={branch.branch_id}>{branch.branch_name}</option>
                ))}
              </select>
            </div>

            <button className="add-user-btn" onClick={() => setIsModalOpen(true)}>
              <FaPlus /> Add User
            </button>
          </div>

          <div className="user-list-container">
            <table>
              <thead>
                <tr>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.user_id}>
                    <td>{user.first_name}</td>
                    <td>{user.last_name}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.role_id}</td>
                    <td>
                      <button className="edit-btn" onClick={() => handleEditUser(user)}><FaEdit /></button>
                      <button className="delete-btn" onClick={() => handleDeleteUser(user.user_id)}><FaTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{editingUser ? "Edit User" : "Add User"}</h2>
                <button className="close-btn" onClick={() => setIsModalOpen(false)}><FaTimes /></button>
              </div>
              <div className="modal-body">
                <label>First Name</label>
                <input type="text" placeholder="Enter First Name" value={newUser.first_name} onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })} />

                <label>Last Name</label>
                <input type="text" placeholder="Enter Last Name" value={newUser.last_name} onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })} />

                <label>Username</label>
                <input type="text" placeholder="Enter Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />

                <label>Password</label>
                <input type="password" placeholder="Enter Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />

                <label>Email</label>
                <input type="email" placeholder="Enter Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />

                <label>Role</label>
                <select value={newUser.role_id} onChange={(e) => setNewUser({ ...newUser, role_id: parseInt(e.target.value) })}>
                  <option value={1}>Admin</option>
                  <option value={2}>Staff</option>
                </select>

                <label>Branch</label>
                <select value={newUser.branch_id || ''} onChange={(e) => setNewUser({ ...newUser, branch_id: parseInt(e.target.value) })}>
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.branch_id} value={branch.branch_id}>{branch.branch_name}</option>
                  ))}
                </select>

                <label>Status</label>
                <select value={newUser.is_active ? 'true' : 'false'} onChange={(e) => setNewUser({ ...newUser, is_active: e.target.value === 'true' })}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>

                <button onClick={handleAddOrUpdateUser}>
                  {editingUser ? <FaEdit /> : <FaPlus />} {editingUser ? "Update" : "Add"} User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
