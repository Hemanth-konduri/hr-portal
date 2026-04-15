import { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/layout/PageWrapper';
import PanelCard from '../../components/dashboard/PanelCard';
import { ThemedButton } from '../../components/shared/ThemedInputs';
import { useTheme } from '../../hooks/useTheme';
import api from '../../api/axios';

const inputCls = 'w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1.5';

export default function Announcements() {
  const t = useTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [form, setForm]                   = useState({ title: '', content: '' });
  const [submitting, setSubmitting]       = useState(false);

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/announcements');
      setAnnouncements(data);
    } catch { } finally { setLoading(false); }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/announcements', form);
      setForm({ title: '', content: '' });
      fetchAnnouncements();
    } catch (err) { alert(err.response?.data?.msg || 'Error posting'); }
    finally { setSubmitting(false); }
  };

  const handleToggle = async (id, isActive) => {
    try {
      await api.patch(`/announcements/${id}`, { is_active: !isActive });
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_active: !isActive } : a));
    } catch { alert('Error updating'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch { alert('Error deleting'); }
  };

  return (
    <PageWrapper title="Announcements">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[400px_1fr]">

          {/* Post form */}
          <PanelCard icon={Plus} title="Post Announcement" subtitle="Visible to all employees on their dashboard">
            <form onSubmit={handlePost} className="space-y-4">
              <div>
                <label className={labelCls}>Title *</label>
                <input required type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Office closed on Friday" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Content *</label>
                <textarea required rows={5} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="Write the full announcement here..."
                  className={`${inputCls} resize-none`} />
              </div>
              <ThemedButton type="submit" disabled={submitting} className="w-full py-2.5">
                {submitting ? 'Posting...' : 'Post Announcement'}
              </ThemedButton>
            </form>
          </PanelCard>

          {/* Announcements list */}
          <PanelCard icon={Megaphone} title="All Announcements" subtitle={`${announcements.length} total`}>
            {loading ? (
              <div className="py-12 text-center text-gray-400">Loading...</div>
            ) : announcements.length === 0 ? (
              <div className="py-12 text-center text-gray-400">No announcements posted yet</div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {announcements.map((a, i) => (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className={`p-5 rounded-2xl border transition-all ${a.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${a.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <h4 className="font-semibold text-gray-800">{a.title}</h4>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => handleToggle(a.id, a.is_active)} title={a.is_active ? 'Hide' : 'Show'}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-all">
                          {a.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button onClick={() => handleDelete(a.id)} title="Delete"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{a.content}</p>
                    <p className="text-xs text-gray-400 mt-3">{new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </PanelCard>
        </div>
      </div>
    </PageWrapper>
  );
}
