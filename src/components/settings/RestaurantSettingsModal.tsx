import React, { useState, useRef } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RestaurantSettings, FirebaseConfigData, MenuItem } from '../../types/restaurant';
import { firebaseSyncService } from '../../services/firebaseSync';
import {
  X,
  Settings,
  Building,
  Receipt,
  Cloud,
  CheckCircle2,
  Tv,
  Smartphone,
  Info,
  ShieldAlert,
  Save,
  Radio,
  ExternalLink,
  FileUp,
  FileDown,
  RotateCcw,
  FileJson,
  UtensilsCrossed,
  Check,
  AlertCircle,
} from 'lucide-react';

interface RestaurantSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RestaurantSettingsModal: React.FC<RestaurantSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    restaurantSettings,
    updateRestaurantSettings,
    isFirestoreConnected,
    connectFirestore,
    disconnectFirestore,
    menu,
    updateWholeMenu,
    resetMenuToDefault,
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'business' | 'tax' | 'firebase' | 'menu'>('business');

  // Business and Tax form state
  const [formData, setFormData] = useState<RestaurantSettings>(restaurantSettings);

  // Menu file attachment state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stagedMenu, setStagedMenu] = useState<MenuItem[] | null>(null);
  const [menuFileName, setMenuFileName] = useState<string>('');
  const [menuImportStatus, setMenuImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Firebase Firestore config state
  const storedFb = firebaseSyncService.getStoredConfig();
  const [fbConfig, setFbConfig] = useState<FirebaseConfigData>({
    projectId: storedFb?.projectId || '',
    apiKey: storedFb?.apiKey || '',
    authDomain: storedFb?.authDomain || '',
    appId: storedFb?.appId || '',
    channelId: storedFb?.channelId || 'amravati_kitchen_main',
  });

  const [fbStatusMessage, setFbStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateRestaurantSettings(formData);
    onClose();
  };

  const handleConnectFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbConfig.projectId || !fbConfig.apiKey) {
      setFbStatusMessage('Please provide at least a Project ID and API Key.');
      return;
    }

    const success = connectFirestore(fbConfig);
    if (success) {
      setFbStatusMessage('Successfully connected to Cloud Firestore! Orders will now sync across all phones & Kitchen TV in real time.');
    } else {
      setFbStatusMessage('Failed to initialize Firebase with provided credentials. Please check your config.');
    }
  };

  // Export current active menu as JSON file
  const handleExportMenuJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(menu, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `varhad_rasoi_menu_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Download clean sample template with schema guidance
  const handleDownloadSampleTemplate = () => {
    const sampleTemplate: MenuItem[] = [
      {
        id: "dish-sample-1",
        name: "Authentic Saoji Mutton Sukka",
        localName: "सावजी मटन सुक्का (अमरावती)",
        category: "Saoji Treats",
        description: "Fiery dry mutton preparation cooked in stone-ground 32-spice Vidarbha Saoji masala.",
        price: 360,
        isVeg: false,
        isSpicy: true,
        spiceLevel: 3,
        inventoryItemId: "inv-mutton",
        prepTimeMinutes: 20,
        station: "Curry & Saoji Station",
        isAmravatiSpecial: true,
        tags: ["Spicy", "Chef Special", "Saoji", "Amravati"]
      },
      {
        id: "dish-sample-2",
        name: "Amravati Special Tarri Poha",
        localName: "अमरावतीची प्रसिद्ध तर्री पोहे",
        category: "Varhadi Specials",
        description: "Flattened rice tempered with mustard, peanuts, topped with spicy chana tarri and lemon.",
        price: 80,
        isVeg: true,
        isSpicy: true,
        spiceLevel: 2,
        inventoryItemId: "inv-poha",
        prepTimeMinutes: 10,
        station: "Rice & Starters",
        isAmravatiSpecial: true,
        tags: ["Breakfast", "Local Heritage"]
      }
    ];

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sampleTemplate, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'menu_sample_template.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Handle single file upload / attachment (.json)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMenuFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          setMenuImportStatus({
            success: false,
            message: 'Invalid file structure: The attachment must contain a JSON array of dish objects.',
          });
          setStagedMenu(null);
          return;
        }

        const validItems = parsed.filter((it: any) => it && it.id && it.name && typeof it.price === 'number');
        if (validItems.length === 0) {
          setMenuImportStatus({
            success: false,
            message: 'No valid dishes detected in the file. Ensure each dish has "id", "name", and numeric "price".',
          });
          setStagedMenu(null);
          return;
        }

        setStagedMenu(validItems);
        setMenuImportStatus({
          success: true,
          message: `File verified! Found ${validItems.length} valid dishes. Click "Apply New Menu" below to activate.`,
        });
      } catch (err: any) {
        setMenuImportStatus({
          success: false,
          message: `JSON syntax error: ${err.message || 'Could not parse JSON'}. Please check for syntax errors.`,
        });
        setStagedMenu(null);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyStagedMenu = () => {
    if (!stagedMenu || stagedMenu.length === 0) return;
    const res = updateWholeMenu(stagedMenu);
    if (res.success) {
      setMenuImportStatus({
        success: true,
        message: `Successfully loaded ${res.count} dishes! Menu updated in memory and local storage across all terminals.`,
      });
      setStagedMenu(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setMenuImportStatus({
        success: false,
        message: res.error || 'Failed to update menu.',
      });
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Restore the default Varhad Rasoi Amravati menu? This will overwrite your uploaded custom menu.')) {
      resetMenuToDefault();
      setStagedMenu(null);
      setMenuFileName('');
      setMenuImportStatus({
        success: true,
        message: 'Original Amravati restaurant menu restored successfully.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl overflow-hidden my-auto text-neutral-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                Restaurant POS & Cloud Sync Settings
              </h2>
              <p className="text-xs text-neutral-400">
                Configure business details, GST tax rates, menu file attachment, and Firebase sync
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-4 pt-2 gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('business')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'business'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Business Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('tax')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'tax'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Taxation & Charges</span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'menu'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Menu File (Update All)</span>
            <span className="text-[10px] font-mono bg-neutral-800 text-amber-400 px-1.5 py-0.2 rounded">
              {menu.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('firebase')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'firebase'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Multi-Phone Cloud Sync</span>
            {isFirestoreConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'business' && (
            <form id="business-form" onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">
                    Restaurant Legal / Brand Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">
                  Full Street Address
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">
                    State & Postal Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">
                    Official Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">
                    Official Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">
                    GSTIN (Tax Identification)
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    placeholder="e.g. 27AABCV1234F1Z8"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">
                    FSSAI License Number
                  </label>
                  <input
                    type="text"
                    value={formData.fssaiNumber}
                    onChange={(e) => setFormData({ ...formData, fssaiNumber: e.target.value })}
                    placeholder="e.g. 11522026000412"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            </form>
          )}

          {activeTab === 'tax' && (
            <form id="tax-form" onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-400 leading-relaxed">
                Configure your restaurant&apos;s applicable tax structure. These rates will be applied dynamically to all customer bills, KDS order totals, and printed tax invoices.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">
                    CGST Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="28"
                    value={formData.cgstRate}
                    onChange={(e) => setFormData({ ...formData, cgstRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500/50"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">Default: 2.5%</span>
                </div>

                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">
                    SGST Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="28"
                    value={formData.sgstRate}
                    onChange={(e) => setFormData({ ...formData, sgstRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500/50"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">Default: 2.5%</span>
                </div>

                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">
                    Service Charge (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={formData.serviceChargeRate}
                    onChange={(e) => setFormData({ ...formData, serviceChargeRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500/50"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">Optional (0% if none)</span>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px]">
                <strong>Total Tax Applied:</strong> {(formData.cgstRate + formData.sgstRate).toFixed(1)}% GST + {formData.serviceChargeRate}% Service Charge.
              </div>
            </form>
          )}

          {activeTab === 'firebase' && (
            <div className="space-y-4 text-xs">
              {/* How it works banner */}
              <div className="p-4 bg-gradient-to-r from-blue-950/40 to-neutral-950 border border-blue-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                  <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
                  <span>Shared Real-Time Multi-Device Sync Engine</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Connect multiple devices to the same restaurant:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Waiter Phones:</strong> Take orders & view prep status</span>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center gap-2">
                    <Tv className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Kitchen TV:</strong> Live bump bar & preparation line</span>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-400 shrink-0" />
                    <span><strong>Cashier Terminal:</strong> Generates & prints bills</span>
                  </div>
                </div>
              </div>

              {/* Status Alert */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isFirestoreConnected
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
              }`}>
                <div className="flex items-center gap-2">
                  {isFirestoreConnected ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span>
                    <strong>Status:</strong> {isFirestoreConnected
                      ? `Cloud Firestore Active on channel "${fbConfig.channelId}"`
                      : 'Local Device Mode (BroadcastChannel). Connect Firebase below for multi-phone sync.'}
                  </span>
                </div>

                {isFirestoreConnected && (
                  <button
                    onClick={() => {
                      disconnectFirestore();
                      setFbStatusMessage('Disconnected from Firebase. Operating in local mode.');
                    }}
                    className="text-[11px] text-red-400 hover:text-red-300 underline"
                  >
                    Disconnect
                  </button>
                )}
              </div>

              {fbStatusMessage && (
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-200">
                  {fbStatusMessage}
                </div>
              )}

              {/* Setup Form */}
              <form onSubmit={handleConnectFirebase} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-300 font-semibold block mb-1">
                      Firebase Project ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. smart-restaurant-pos"
                      value={fbConfig.projectId}
                      onChange={(e) => setFbConfig({ ...fbConfig, projectId: e.target.value.trim() })}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-300 font-semibold block mb-1">
                      API Key
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="AIzaSy..."
                      value={fbConfig.apiKey}
                      onChange={(e) => setFbConfig({ ...fbConfig, apiKey: e.target.value.trim() })}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-300 font-semibold block mb-1">
                      Shared Restaurant Channel ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. amravati_kitchen_main"
                      value={fbConfig.channelId}
                      onChange={(e) => setFbConfig({ ...fbConfig, channelId: e.target.value.trim() })}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500/50"
                    />
                    <span className="text-[10px] text-neutral-500 mt-0.5 block">
                      Use the exact same Channel ID on all mobile phones & TV screen to link them together.
                    </span>
                  </div>

                  <div>
                    <label className="text-neutral-300 font-semibold block mb-1">
                      App ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="1:123456789:web:abcdef"
                      value={fbConfig.appId || ''}
                      onChange={(e) => setFbConfig({ ...fbConfig, appId: e.target.value.trim() })}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-[11px] text-neutral-400 space-y-1.5 leading-relaxed">
                  <div className="font-semibold text-neutral-200">How to get your credentials in 2 minutes:</div>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">console.firebase.google.com</a> and create a free project.</li>
                    <li>Click &quot;Build &gt; Firestore Database&quot; and select &quot;Create Database&quot; (Start in Test Mode).</li>
                    <li>Go to Project Settings &gt; General &gt; Add Web App to copy your Project ID and API Key.</li>
                    <li>Paste them here on all staff phones. Real-time multi-device sync activates immediately!</li>
                  </ol>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition"
                  >
                    Connect & Activate Cloud Sync
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: Single File Menu Attachment & Import/Export */}
          {activeTab === 'menu' && (
            <div className="space-y-4 text-xs">
              {/* Informational banner */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
                <FileJson className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-sm">
                    Single File Menu Management (Attach &amp; Update)
                  </h3>
                  <p className="text-neutral-300 leading-relaxed text-[11px]">
                    Update your restaurant's entire menu using a single file attachment! Download the current menu as a <code className="text-amber-400 bg-neutral-900 px-1 py-0.5 rounded font-mono">.json</code> file, adjust prices or names, and attach the updated file here to synchronize all waiter terminals and kitchen stations instantly.
                  </p>
                </div>
              </div>

              {/* Status Message */}
              {menuImportStatus && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                  menuImportStatus.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/40 text-red-300'
                }`}>
                  {menuImportStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span className="text-xs">{menuImportStatus.message}</span>
                </div>
              )}

              {/* Action Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Step 1: Export Current Menu */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-white font-bold text-sm mb-1">
                      <FileDown className="w-4 h-4 text-amber-400" />
                      <span>1. Export Current Menu File</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Download the complete active menu with all {menu.length} dishes, prices, categories, and inventory mappings as a single file.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleExportMenuJson}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition border border-neutral-700 cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 text-amber-400" />
                      <span>Download Menu (.json)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadSampleTemplate}
                      className="px-2.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl text-[11px] transition border border-neutral-800 cursor-pointer"
                      title="Download sample template file"
                    >
                      Template
                    </button>
                  </div>
                </div>

                {/* Step 2: Upload / Attach Menu File */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-white font-bold text-sm mb-1">
                      <FileUp className="w-4 h-4 text-emerald-400" />
                      <span>2. Attach &amp; Upload New Menu File</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Select your edited <code className="text-emerald-400 font-mono">.json</code> file to overwrite and update the whole menu at once.
                    </p>
                  </div>

                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="menu-file-input"
                    />
                    <label
                      htmlFor="menu-file-input"
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-neutral-700 hover:border-emerald-500 bg-neutral-900/80 hover:bg-neutral-900 text-neutral-300 hover:text-white cursor-pointer transition text-xs font-medium text-center"
                    >
                      <FileUp className="w-4 h-4 text-emerald-400" />
                      <span className="truncate">
                        {menuFileName ? menuFileName : 'Click to Attach Menu File (.json)'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Staged Menu Confirmation Card (if file was attached) */}
              {stagedMenu && stagedMenu.length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-neutral-900 border border-emerald-500/40 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="font-bold text-white text-sm">
                        Ready to Replace Entire Menu
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                      {stagedMenu.length} Dishes Verified
                    </span>
                  </div>

                  <div className="text-[11px] text-neutral-300">
                    Preview of dishes: <strong>{stagedMenu.slice(0, 4).map(d => d.name).join(', ')}</strong>{stagedMenu.length > 4 ? ` and ${stagedMenu.length - 4} more...` : ''}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleApplyStagedMenu}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-neutral-950 font-black text-xs shadow-lg shadow-emerald-950/40 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Apply &amp; Update Whole Menu Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStagedMenu(null);
                        setMenuFileName('');
                      }}
                      className="py-2.5 px-3 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Schema Guide / File Format Reference */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-200 font-bold text-xs flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    <span>Single File Schema Fields Reference</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">Format: JSON Array of Objects</span>
                </div>

                <div className="p-2.5 bg-neutral-900 rounded-lg font-mono text-[10px] text-neutral-300 overflow-x-auto leading-relaxed border border-neutral-800">
                  <span className="text-neutral-500">// Example dish object:</span>{'\n'}
                  {`{\n  "id": "dish-saoji-chicken",\n  "name": "Saoji Handi Chicken",\n  "localName": "सावजी हांडी चिकन",\n  "category": "Saoji Treats",\n  "price": 320,\n  "isVeg": false,\n  "prepTimeMinutes": 18,\n  "station": "Curry & Saoji Station",\n  "inventoryItemId": "inv-chicken"\n}`}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400">
                  <span>Source file in project: <code className="text-amber-400 font-mono">/src/data/amravatiMenu.ts</code></span>
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer underline"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Original Amravati Menu</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            Smart Restaurant POS &bull; Settings persistent
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>

            {activeTab !== 'firebase' && activeTab !== 'menu' && (
              <button
                type="submit"
                form={activeTab === 'business' ? 'business-form' : 'tax-form'}
                className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Settings</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
