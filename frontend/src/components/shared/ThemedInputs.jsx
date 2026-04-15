import { useTheme } from '../../hooks/useTheme';

export function ThemedInput({ className = '', ...props }) {
  const t = useTheme();
  return (
    <input
      className={`w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none ${t.primaryRing} focus:bg-white transition-all ${className}`}
      {...props}
    />
  );
}

export function ThemedSelect({ className = '', children, ...props }) {
  const t = useTheme();
  return (
    <select
      className={`w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none ${t.primaryRing} transition-all ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function ThemedTextarea({ className = '', ...props }) {
  const t = useTheme();
  return (
    <textarea
      className={`w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none ${t.primaryRing} focus:bg-white transition-all resize-none ${className}`}
      {...props}
    />
  );
}

export function ThemedButton({ className = '', children, ...props }) {
  const t = useTheme();
  return (
    <button
      className={`${t.primary} ${t.primaryHover} text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-all disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
