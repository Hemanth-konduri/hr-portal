import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEPARTMENTS = ['HR', 'Engineering', 'Sales', 'Marketing', 'Finance', 'Operations', 'Design'];

const inputCls = "w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 focus:bg-white transition-all";
const labelCls = "block text-xs font-medium text-gray-500 mb-1.5";

export default function UserFormModal({ open, onClose, onSubmit, defaultRole = 'employee', allowAdminRole = false, editData = null }) {
  const isEdit = !!editData;

  const [form, setForm] = useState({
    full_name: '', email: '', role: defaultRole,
    position: '', phone: '', department_id: '', date_of_joining: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (editData) {
      setForm({
        full_name:       editData.full_name       || '',
        email:           editData.email           || '',
        role:            editData.role            || defaultRole,
        position:        editData.position        || '',
        phone:           editData.phone           || '',
        department_id:   editData.department_id   || '',
        date_of_joining: editData.date_of_joining ? editData.date_of_joining.split('T')[0] : '',
      });
    } else {
      setForm({ full_name: '', email: '', role: defaultRole, position: '', phone: '', department_id: '', date_of_joining: '' });
    }
    setError('');
  }, [editData, open, defaultRole]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.msg || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg rounded-2xl bg-white border border-gray-200 shadow-xl p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {isEdit ? 'Edit User' : `Create ${form.role === 'admin' ? 'Admin' : 'Employee'}`}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {isEdit ? 'Update user details below' : 'Credentials will be sent via email'}
                </p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">

                <div className="col-span-2">
                  <label className={labelCls}>Full Name *</label>
                  <input required type="text" value={form.full_name} onChange={set('full_name')}
                    placeholder="John Doe" className={inputCls} />
                </div>

                <div className="col-span-2">
                  <label className={labelCls}>Email Address *</label>
                  <input required type="email" value={form.email} onChange={set('email')}
                    placeholder="john@company.com" disabled={isEdit}
                    className={`${inputCls} ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`} />
                </div>

                {!isEdit && allowAdminRole && (
                  <div className="col-span-2">
                    <label className={labelCls}>Role *</label>
                    <select value={form.role} onChange={set('role')} className={inputCls}>
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className={labelCls}>Position</label>
                  <input type="text" value={form.position} onChange={set('position')}
                    placeholder="e.g. Developer" className={inputCls} />
                </div>

                <div>
                  <label className={labelCls}>Phone</label>
                  <input type="tel" value={form.phone} onChange={set('phone')}
                    placeholder="+91 9999999999" className={inputCls} />
                </div>

                <div>
                  <label className={labelCls}>Department</label>
                  <select value={form.department_id} onChange={set('department_id')} className={inputCls}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Date of Joining</label>
                  <input type="date" value={form.date_of_joining} onChange={set('date_of_joining')} className={inputCls} />
                </div>
              </div>

              {!isEdit && (
                <p className="text-xs text-gray-400 pt-1">
                  🔐 A secure temporary password will be auto-generated and sent to the email above.
                </p>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create & Send Email'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
