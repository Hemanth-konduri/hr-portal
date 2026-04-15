import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const useUsers = (roleFilter = null) => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/users');
      const filtered = roleFilter ? data.filter(u => u.role === roleFilter) : data;
      setUsers(filtered);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = async (payload) => {
    const { data } = await api.post('/users/create', payload);
    await fetchUsers();
    return data;
  };

  const updateUser = async (id, payload) => {
    const { data } = await api.put(`/users/${id}`, payload);
    await fetchUsers();
    return data;
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await api.patch(`/users/${id}/status`, { status: newStatus });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
  };

  const suspendUser = async (id) => {
    await api.patch(`/users/${id}/status`, { status: 'suspended' });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'suspended' } : u));
  };

  return { users, loading, error, fetchUsers, createUser, updateUser, toggleStatus, suspendUser };
};
