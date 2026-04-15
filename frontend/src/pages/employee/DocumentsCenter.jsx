import { useState, useEffect } from 'react';
import { FileUp, FileText, Download, File } from 'lucide-react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/layout/PageWrapper';
import PanelCard from '../../components/dashboard/PanelCard';
import StatsRow from '../../components/shared/StatsRow';
import { ThemedButton } from '../../components/shared/ThemedInputs';
import { useTheme } from '../../hooks/useTheme';
import api from '../../api/axios';

const labelCls = 'block text-xs font-medium text-gray-500 mb-1.5';
const inputCls = 'w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30 transition-all';

const DOC_LABELS = { aadhar: 'Aadhar Card', pan: 'PAN Card', offer_letter: 'Offer Letter', appointment_letter: 'Appointment Letter', other: 'Other' };

export default function DocumentsCenter() {
  const t = useTheme();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [upload, setUpload]       = useState({ document_type: 'other', file: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    api.get('/documents/my').then(r => setDocuments(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!upload.file) return alert('Select a file');
    setSubmitting(true);
    const fd = new FormData();
    fd.append('document_type', upload.document_type);
    fd.append('document', upload.file);
    try {
      await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUpload({ document_type: 'other', file: null });
      fetchDocuments();
    } catch (err) { alert(err.response?.data?.msg || 'Upload failed'); }
    finally { setSubmitting(false); }
  };

  const byType = Object.keys(DOC_LABELS).reduce((acc, k) => {
    acc[k] = documents.filter(d => d.document_type === k);
    return acc;
  }, {});

  return (
    <PageWrapper title="Documents Center">
      <div className="space-y-6">

        <StatsRow stats={[
          { title: 'Total Documents', value: documents.length,                                    icon: FileText, iconBg: 'bg-violet-50', iconColor: 'text-violet-500' },
          { title: 'Aadhar',          value: byType.aadhar.length,                               icon: File,     iconBg: 'bg-blue-50',   iconColor: 'text-blue-500'   },
          { title: 'PAN Card',        value: byType.pan.length,                                  icon: File,     iconBg: 'bg-green-50',  iconColor: 'text-green-500'  },
          { title: 'Other Docs',      value: (byType.offer_letter.length + byType.other.length), icon: FileUp,   iconBg: 'bg-amber-50',  iconColor: 'text-amber-500'  },
        ]} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">

          {/* Upload */}
          <PanelCard icon={FileUp} title="Upload Document" subtitle="PDF, JPG, PNG supported">
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className={labelCls}>Document Type *</label>
                <select value={upload.document_type} onChange={e => setUpload({ ...upload, document_type: e.target.value })} className={inputCls}>
                  {Object.entries(DOC_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>File *</label>
                <label htmlFor="doc-upload"
                  className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:border-violet-400 hover:bg-violet-50/30 transition-all">
                  <FileUp size={28} className="text-gray-400" />
                  <span className="text-sm text-gray-500 text-center">{upload.file ? upload.file.name : 'Click to browse file'}</span>
                  <span className="text-xs text-gray-400">PDF, JPG, PNG</span>
                  <input id="doc-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                    onChange={e => setUpload({ ...upload, file: e.target.files[0] })} />
                </label>
              </div>
              <ThemedButton type="submit" disabled={submitting} className="w-full py-2.5">
                {submitting ? 'Uploading...' : 'Upload Document'}
              </ThemedButton>
            </form>
          </PanelCard>

          {/* Documents list */}
          <PanelCard icon={FileText} title="My Documents" subtitle={`${documents.length} documents uploaded`}>
            {loading ? (
              <div className="py-12 text-center text-gray-400">Loading...</div>
            ) : documents.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <FileText size={40} className="mx-auto mb-3 text-gray-200" />
                <p>No documents uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documents.map((doc, i) => (
                  <motion.div key={doc.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-10 h-10 rounded-xl ${t.iconBg} ${t.iconColor} flex items-center justify-center flex-shrink-0`}>
                        <FileText size={18} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-gray-800 truncate">{doc.file_name}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">{DOC_LABELS[doc.document_type] || doc.document_type}</p>
                      </div>
                    </div>
                    <a href={`http://localhost:5000${doc.file_path}`} target="_blank" rel="noreferrer"
                      className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-all flex-shrink-0">
                      <Download size={16} />
                    </a>
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
