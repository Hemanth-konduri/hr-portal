import Sidebar from './Sidebar';
import Header from './Header';
import { motion, AnimatePresence } from 'framer-motion';

export default function PageWrapper({ children, title }) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Background set in global CSS */}
      
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative z-0 relative">
        <Header title={title} />
        
        <main className="flex-1 overflow-y-auto p-8 relative">
           <AnimatePresence mode="wait">
             <motion.div
               key={title}
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: -20, opacity: 0 }}
               transition={{ duration: 0.3 }}
               className="h-full"
             >
               {children}
             </motion.div>
           </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
