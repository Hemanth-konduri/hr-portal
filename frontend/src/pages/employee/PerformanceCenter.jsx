import { useState, useEffect } from 'react';
import { Award, Star, MessageSquare, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/layout/PageWrapper';
import PanelCard from '../../components/dashboard/PanelCard';
import StatsRow from '../../components/shared/StatsRow';
import { useTheme } from '../../hooks/useTheme';
import api from '../../api/axios';

export default function PerformanceCenter() {
  const t = useTheme();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/performance/my').then(r => setReviews(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;

  const Stars = ({ rating }) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={16} className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  );

  return (
    <PageWrapper title="Performance Center">
      <div className="space-y-6">

        <StatsRow stats={[
          { title: 'Total Reviews',  value: reviews.length,                                                    icon: Award,      iconBg: 'bg-violet-50', iconColor: 'text-violet-500' },
          { title: 'Average Rating', value: `${avgRating}/5`,                                                  icon: Star,       iconBg: 'bg-amber-50',  iconColor: 'text-amber-500'  },
          { title: 'Latest Rating',  value: reviews[0] ? `${reviews[0].rating}/5` : '—',                      icon: TrendingUp, iconBg: 'bg-green-50',  iconColor: 'text-green-500'  },
          { title: 'Periods Covered',value: [...new Set(reviews.map(r => r.period?.split('-')[0]))].length,    icon: MessageSquare, iconBg: 'bg-blue-50', iconColor: 'text-blue-500'  },
        ]} />

        <PanelCard icon={Award} title="My Performance Reviews" subtitle="Ratings and feedback from your manager">
          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Award size={40} className="mx-auto mb-3 text-gray-200" />
              <p>No performance reviews yet</p>
            </div>
          ) : (
            <div className="space-y-5">
              {reviews.map((rev, i) => (
                <motion.div key={rev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${t.badge}`}>
                        {rev.period}
                      </span>
                      <div className="mt-3"><Stars rating={rev.rating} /></div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">{rev.rating}<span className="text-lg text-gray-400">/5</span></p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(rev.created_at).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl ${t.primaryBg} border ${t.primaryBorder}`}>
                    <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1.5">
                      <MessageSquare size={12} /> Manager Feedback
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">{rev.feedback || 'No specific feedback provided.'}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </PanelCard>
      </div>
    </PageWrapper>
  );
}
