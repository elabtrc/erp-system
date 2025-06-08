import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import "../settings/users.css";
import { FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
// import { Bell } from "lucide-react";
import { roleApi, permissionApi } from '../../utils/api';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);

  const [newRole, setNewRole] = useState({
    role_name: "",
    description: "",
    permission_ids: [],
    status: "Active" // client-only field for UI filtering
  });

  const [editingRole, setEditingRole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rolesRes = await roleApi.getAll();
        const permissionsRes = await permissionApi.getAll();
        setRoles(rolesRes.data || rolesRes);
        setPermissions(permissionsRes.data || permissionsRes);
      } catch (err) {
        console.error("Error fetching role or permission data:", err);
      }
    };
    fetchData();
  }, []);

  const handleAddOrUpdateRole = async () => {
    if (!newRole.role_name.trim()) return;

    const roleData = {
      role_name: newRole.role_name.trim(),
      description: newRole.description || null,
      permission_ids: newRole.permission_ids
    };

    if (editingRole) {
      await roleApi.update(editingRole.role_id, roleData);
      setRoles(roles.map(role => 
        role.role_id === editingRole.role_id ? { ...role, ...roleData } : role
      ));
      setEditingRole(null);
    } else {
      const created = await roleApi.create(roleData);
      setRoles([...roles, created.data || created]);
    }

    setNewRole({ role_name: "", description: "", permission_ids: [], status: "Active" });
    setIsModalOpen(false);
  };

  const handleDeleteRole = async (id) => {
    await roleApi.delete(id);
    setRoles(roles.filter(role => role.role_id !== id));
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setNewRole({
      role_name: role.role_name,
      description: role.description || "",
      permission_ids: role.permission_ids || [],
      status: "Active" // placeholder for UI
    });
    setIsModalOpen(true);
  };

  const handlePermissionToggle = (permissionId) => {
    if (newRole.permission_ids.includes(permissionId)) {
      setNewRole({
        ...newRole,
        permission_ids: newRole.permission_ids.filter(id => id !== permissionId)
      });
    } else {
      setNewRole({
        ...newRole,
        permission_ids: [...newRole.permission_ids, permissionId]
      });
    }
  };

  return (
    <div className="users-container">
      <Sidebar />
      <div className="users-content">
        <div className="users-header">
          <h1>Role Management</h1>
          <div className="icon-1">
            {/* <Bell className="icon" /> */}
            <div className="user-avatar"></div>
          </div>
        </div>

        <div className="user-management-wrapper">
          <div className="header-container">
            <h2>Roles</h2>
            <button className="add-user-btn" onClick={() => setIsModalOpen(true)}>
              <FaPlus /> Add Role
            </button>
          </div>

          <div className="user-list-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Role Name</th>
                  <th>Description</th>
                  <th>Permissions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role.role_id}>
                    <td>{role.role_id}</td>
                    <td>{role.role_name}</td>
                    <td>{role.description || '-'}</td>
                    <td>
                      {(role.permission_names || []).join(", ")}
                    </td>
                    <td>
                      <button className="edit-btn" onClick={() => handleEditRole(role)}><FaEdit /></button>
                      <button className="delete-btn" onClick={() => handleDeleteRole(role.role_id)}><FaTrash /></button>
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
                <h2>{editingRole ? "Edit Role" : "Add Role"}</h2>
                <button className="close-btn" onClick={() => setIsModalOpen(false)}><FaTimes /></button>
              </div>
              <div className="modal-body">
                <label>Role Name</label>
                <input 
                  type="text" 
                  placeholder="Enter Role Name" 
                  value={newRole.role_name} 
                  onChange={(e) => setNewRole({ ...newRole, role_name: e.target.value })} 
                />

                <label>Description</label>
                <textarea 
                  placeholder="Enter Role Description" 
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  rows={3}
                />

                <label>Permissions</label>
                <div className="permissions-container">
                  {permissions.map(p => (
                    <label key={p.permission_id} className={`permission-badge ${newRole.permission_ids.includes(p.permission_id) ? 'active' : ''}`}>
                      <input
                        type="checkbox"
                        checked={newRole.permission_ids.includes(p.permission_id)}
                        onChange={() => handlePermissionToggle(p.permission_id)}
                      />
                      <span>{p.permission_name.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>

                <button onClick={handleAddOrUpdateRole}>
                  {editingRole ? <FaEdit /> : <FaPlus />} {editingRole ? "Update" : "Add"} Role
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManagement;
