import { useRegisterSW } from 'virtual:pwa-register/react'
import { useState, useEffect } from 'react'

const PwaBadge = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  // Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already in standalone mode
    const isStandAlone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(isStandAlone)

    if (isStandAlone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod|macintosh/.test(userAgent) && 'ontouchend' in document;
    setIsIOS(isIosDevice);

    if (isIosDevice) {
       // On iOS, we just show the instruction if not standalone
       setShowInstallPrompt(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const closePrompt = () => setShowInstallPrompt(false);
  const closeUpdate = () => setNeedRefresh(false);

  if (isStandalone) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm mx-auto">
      
      {/* Update Available Toast */}
      {needRefresh && (
        <div className="bg-slate-800 dark:bg-slate-700 text-white p-4 rounded-xl shadow-lg flex flex-col gap-3 pointer-events-auto border border-slate-600">
          <div className="text-sm">
            <p className="font-bold text-base">Update Available</p>
            <p className="text-slate-300 mt-1">A new version of Budgeting App is ready to be installed.</p>
          </div>
          <div className="flex gap-3 justify-end mt-1">
             <button onClick={closeUpdate} className="text-slate-400 hover:text-white px-3 py-2 text-sm font-medium">Not now</button>
             <button onClick={() => updateServiceWorker(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Update App</button>
          </div>
        </div>
      )}

      {/* Install Prompt Toast */}
      {showInstallPrompt && !needRefresh && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-2xl flex flex-col gap-3 pointer-events-auto border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start">
             <div>
               <p className="font-bold text-slate-800 dark:text-slate-100">Install Budgeting App</p>
               <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Add to your home screen for quick access and a seamless native app experience.</p>
             </div>
             <button onClick={closePrompt} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl leading-none ml-2">&times;</button>
          </div>
          
          {isIOS ? (
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-sm text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 mt-2">
               <span>Tap</span>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                 <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                 <polyline points="16 6 12 2 8 6"></polyline>
                 <line x1="12" y1="2" x2="12" y2="15"></line>
               </svg>
               <span>then <strong>Add to Home Screen</strong></span>
            </div>
          ) : (
            <button onClick={handleInstallClick} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors mt-1">
              Install App
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default PwaBadge;
