import { useState } from 'react';
import { Edit2, PowerOff, ShieldOff, ChevronUp, ChevronDown, Search } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function UsersTable({ users, onEdit, onToggleStatus, onSuspend, showRole = false }) {
  const [sortField, setSortField] = useState('full_name');
  const [sortDir, setSortDir]     = useState('asc');
  const [search, setSearch]       = useState('');

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = users
    .filter(u =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.employee_id?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const va = a[sortField] || '';
      const vb = b[sortField] || '';
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const SortIcon = ({ field }) => (
    <span className="ml-1 inline-flex flex-col">
      <ChevronUp  size={10} className={sortField === field && sortDir === 'asc'  ? 'text-amber-500' : 'text-gray-300'} />
      <ChevronDown size={10} className={sortField === field && sortDir === 'desc' ? 'text-amber-500' : 'text-gray-300'} />
    </span>
  );

  const cols = [
    { label: 'ID',         field: 'employee_id' },
    { label: 'Name',       field: 'full_name'   },
    { label: 'Email',      field: 'email'       },
    { label: 'Department', field: 'department'  },
    { label: 'Position',   field: 'position'    },
    ...(showRole ? [{ label: 'Role', field: 'role' }] : []),
    { label: 'Status',     field: 'status'      },
    { label: 'Actions',    field: null          },
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {cols.map(({ label, field }) => (
                <th
                  key={label}
                  onClick={() => field && toggleSort(field)}
                  className={`px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${field ? 'cursor-pointer hover:text-gray-800 select-none' : ''}`}
                >
                  {label}
                  {field && <SortIcon field={field} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="px-5 py-12 text-center text-gray-400">
                  No records found
                </td>
              </tr>
            ) : filtered.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-5 py-4 font-mono text-xs text-gray-400">{user.employee_id || '—'}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {user.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-800 whitespace-nowrap">{user.full_name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-500">{user.email}</td>
                <td className="px-5 py-4 text-gray-500">{user.department || '—'}</td>
                <td className="px-5 py-4 text-gray-500">{user.position || '—'}</td>
                {showRole && (
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200 capitalize">
                      {user.role?.replace('_', ' ')}
                    </span>
                  </td>
                )}
                <td className="px-5 py-4"><StatusBadge status={user.status} /></td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(user)} title="Edit"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-all">
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => onToggleStatus(user.id, user.status)}
                      title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                      className={`p-1.5 rounded-lg transition-all ${
                        user.status === 'active'
                          ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                          : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                      }`}
                    >
                      <PowerOff size={15} />
                    </button>
                    {user.status !== 'suspended' && (
                      <button onClick={() => onSuspend(user.id)} title="Suspend"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all">
                        <ShieldOff size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 text-right">{filtered.length} of {users.length} records</p>
    </div>
  );
}
