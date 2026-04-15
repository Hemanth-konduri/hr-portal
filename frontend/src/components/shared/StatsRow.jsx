import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';

export default function StatsRow({ stats }) {
  const t = useTheme();
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map(({ title, value, icon: Icon, iconBg, iconColor }, i) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4"
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg || t.iconBg}`}>
            <Icon size={20} className={iconColor || t.iconColor} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">{title}</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
