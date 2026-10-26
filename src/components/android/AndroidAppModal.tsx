import React, { useState } from 'react';
import { usePWAInstall } from '../common/usePWAInstall';
import {
  Smartphone,
  Download,
  Terminal,
  Printer,
  QrCode,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  FolderGit2,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'instant' | 'capacitor' | 'printer' | 'playstore'>('instant');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-pjseyybx5m4i7lkcdb4f7l-577920734496.asia-southeast1.run.app';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto font-['Outfit']">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-750 rounded-3xl shadow-2xl overflow-hidden my-auto text-neutral-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-neutral-950 font-bold shadow-lg shadow-emerald-950/30">
              <Smartphone className="w-5 h-5 fill-neutral-950 text-neutral-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Android App &amp; APK Deployment
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  Ready
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                1-tap WebAPK install, native Capacitor Android Studio project, and thermal printer bridge
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-4 pt-2 gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'instant', label: '1-Tap Android Install', icon: Download },
            { id: 'capacitor', label: 'Native Android Studio (.APK)', icon: Terminal },
            { id: 'printer', label: 'Thermal Printer Bridge', icon: Printer },
            { id: 'playstore', label: 'Play Store & Sideloading', icon: ShieldCheck },
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isSel
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: 1-Tap Instant Install */}
          {activeTab === 'instant' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-green-500/10 to-teal-500/10 border border-emerald-500/30 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40">
                    Recommended For Tablet POS
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Direct Android WebAPK Installation
                  </h3>
                  <p className="text-neutral-300 text-xs leading-relaxed max-w-lg">
                    On Android devices running Chrome, Edge, or Samsung Internet, Google Play Services automatically compiles this PWA into an actual signed Android application with dedicated home screen icon, fullscreen window, and offline support.
                  </p>
                </div>
                <Smartphone className="w-10 h-10 text-emerald-400 shrink-0 opacity-80 hidden sm:block" />
              </div>

              {/* Install Status Card */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">Install Status on This Device</h4>
                    <p className="text-neutral-400 text-[11px]">
                      {isInstalled
                        ? 'App is already installed and running in native standalone window!'
                        : isInstallable
                        ? 'Ready to install on this device right now!'
                        : 'Open this URL in Google Chrome on your Android tablet or phone to install directly.'}
                    </p>
                  </div>
                  {isInstalled && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Installed
                    </span>
                  )}
                </div>

                {isInstallable && !isInstalled && (
                  <button
                    onClick={install}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-black rounded-xl text-sm transition shadow-lg shadow-emerald-950/40 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install Android App Now</span>
                  </button>
                )}

                {!isInstallable && !isInstalled && (
                  <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2">
                    <span className="font-bold text-amber-400 block">How to install on Android Tablet / Phone:</span>
                    <ol className="list-decimal list-inside space-y-1 text-neutral-300 leading-relaxed text-[11px]">
                      <li>Open this URL in <strong>Google Chrome</strong> on your Android device.</li>
                      <li>Tap the <strong>three dots menu (⋮)</strong> at the top right of Chrome.</li>
                      <li>Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</li>
                      <li>Android will automatically install <strong>VarhadPOS</strong> onto your app drawer.</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* QR Code for Opening on Android Tablet */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                <div className="w-28 h-28 bg-white p-2 rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                  <QrCode className="w-24 h-24 text-neutral-950" />
                </div>
                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    Scan with Android Camera / Tablet
                  </span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Point any Android phone or tablet camera at this screen to open the app and install it in one tap:
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      value={currentAppUrl}
                      className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-750 rounded-xl text-[11px] text-neutral-300 font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(currentAppUrl, 'url')}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
                    >
                      {copiedCmd === 'url' ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Capacitor Native Android Studio */}
          {activeTab === 'capacitor' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-emerald-400" />
                    <span>Native Android Project Configured</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                    Capacitor v8
                  </span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  The complete native Android project has been scaffolded inside the <code>android/</code> directory with <code>AndroidManifest.xml</code>, Gradle build configurations, Bluetooth thermal printer permissions, and offline web bundles.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
                  <div className="p-2 bg-neutral-900 rounded-lg border border-neutral-800">
                    <span className="text-neutral-500 block">Package ID:</span>
                    <span className="text-amber-400 font-bold truncate block">com.varhadrasoi.pos</span>
                  </div>
                  <div className="p-2 bg-neutral-900 rounded-lg border border-neutral-800">
                    <span className="text-neutral-500 block">App Name:</span>
                    <span className="text-white font-bold block">Varhad Rasoi POS</span>
                  </div>
                  <div className="p-2 bg-neutral-900 rounded-lg border border-neutral-800">
                    <span className="text-neutral-500 block">Target SDK:</span>
                    <span className="text-emerald-400 font-bold block">Android 14 (API 34)</span>
                  </div>
                </div>
              </div>

              {/* Build Commands Box */}
              <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
                <span className="font-bold text-white text-xs uppercase tracking-wider block">
                  3-Step Command to Build .APK Locally
                </span>

                <div className="space-y-2.5">
                  {[
                    {
                      step: '1',
                      title: 'Build Web Bundle & Sync to Android Studio',
                      cmd: 'npm run android:build',
                      desc: 'Compiles the React production bundle into android/app/src/main/assets/public',
                    },
                    {
                      step: '2',
                      title: 'Open in Android Studio',
                      cmd: 'npx cap open android',
                      desc: 'Launches Android Studio directly with all Gradle dependencies ready',
                    },
                    {
                      step: '3',
                      title: 'Or Build Standalone Debug .APK via Terminal',
                      cmd: 'cd android && ./gradlew assembleDebug',
                      desc: 'Creates app-debug.apk at android/app/build/outputs/apk/debug/app-debug.apk',
                    },
                  ].map(item => (
                    <div key={item.step} className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-200 font-semibold text-[11px]">
                          Step {item.step}: {item.title}
                        </span>
                        <button
                          onClick={() => copyToClipboard(item.cmd, item.step)}
                          className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 font-mono"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedCmd === item.step ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="px-2.5 py-1.5 bg-black/60 rounded-lg font-mono text-[11px] text-emerald-300 overflow-x-auto">
                        {item.cmd}
                      </div>
                      <span className="text-[10px] text-neutral-500 block">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Thermal Printer Bridge */}
          {activeTab === 'printer' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-amber-400" />
                  <h4 className="font-bold text-white text-sm">Android Bluetooth Thermal Printing (ESC/POS)</h4>
                </div>
                <p className="text-neutral-300 text-[11px] leading-relaxed">
                  Android POS tablets print to 58mm or 80mm Bluetooth thermal printers using either of these two native methods:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2">
                    <span className="font-bold text-amber-400 block text-xs">Method A: RawBT Print Service (Recommended)</span>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">
                      Install the free <strong>RawBT</strong> app from Google Play Store on the Android tablet. Pair your Bluetooth printer once. Our app automatically sends 1-tap print intents directly to RawBT with zero manual configuration.
                    </p>
                    <a
                      href="https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:underline"
                    >
                      <span>View RawBT on Google Play</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-3.5 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2">
                    <span className="font-bold text-amber-400 block text-xs">Method B: Direct USB / Bluetooth Hardware</span>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">
                      Connect via USB OTG cable or standard Bluetooth. When you click &quot;Print Invoice&quot;, Android displays the standard Android Print Spooler with paper size, margins, and auto-cutter options.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Play Store & Sideloading */}
          {activeTab === 'playstore' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
                <span className="font-bold text-white text-sm block">
                  Deployment Options for Restaurant Hardware
                </span>

                <div className="space-y-2.5">
                  <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-1">
                    <h5 className="font-bold text-white text-xs">1. Direct APK Sideloading (Commercial Restaurant Tablets)</h5>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">
                      For dedicated devices (Sunmi V2, iMin, Lenovo Tab, Samsung Tab): Copy the compiled <code>app-debug.apk</code> onto an SD card or Google Drive, enable &quot;Install from unknown sources&quot;, and tap to install. No Play Store review required.
                    </p>
                  </div>

                  <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-1">
                    <h5 className="font-bold text-white text-xs">2. Google Play Store Console (App Bundle .AAB)</h5>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">
                      In Android Studio, select <strong>Build &gt; Generate Signed Bundle / APK &gt; Android App Bundle (.aab)</strong>. Upload the resulting <code>.aab</code> file to your Google Play Console account for public or private enterprise distribution.
                    </p>
                  </div>

                  <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-1">
                    <h5 className="font-bold text-white text-xs">3. Bubblewrap / TWA (Trusted Web Activity)</h5>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">
                      Google&apos;s official tool converts your live web app URL into an Android Play Store package in under 2 minutes:
                    </p>
                    <code className="block px-2.5 py-1 bg-black/60 rounded text-[11px] text-emerald-300 font-mono">
                      npx @bubblewrap/cli init --manifest={currentAppUrl}/manifest.webmanifest
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            Varhad Rasoi &bull; Android Native &amp; WebAPK Package Ready
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
