const config = {
  active:    { dot: 'bg-green-500', badge: 'bg-green-50 text-green-700 border-green-200'   },
  inactive:  { dot: 'bg-gray-400',  badge: 'bg-gray-100 text-gray-500  border-gray-200'   },
  suspended: { dot: 'bg-red-500',   badge: 'bg-red-50   text-red-600   border-red-200'    },
};

export default function StatusBadge({ status }) {
  const c = config[status] || config.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}
