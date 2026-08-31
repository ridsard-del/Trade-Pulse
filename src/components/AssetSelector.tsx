import React, { useState } from 'react';
import { Search, ChevronDown, Check, Coins, DollarSign, Gem, Building2 } from 'lucide-react';
import { MarketAsset, AssetCategory, Language } from '../types';
import { translations } from '../utils/translations';

interface AssetSelectorProps {
  assets: MarketAsset[];
  selectedAsset: MarketAsset;
  onSelectAsset: (asset: MarketAsset) => void;
  language: Language;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  assets,
  selectedAsset,
  onSelectAsset,
  language,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all');
  const t = translations[language];

  const filteredAssets = assets.filter((asset) => {
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesSearch =
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: AssetCategory) => {
    switch (category) {
      case 'crypto':
        return <Coins className="w-3.5 h-3.5 text-amber-400" />;
      case 'forex':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-400" />;
      case 'commodity':
        return <Gem className="w-3.5 h-3.5 text-yellow-400" />;
      case 'stock':
        return <Building2 className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Selector Trigger Button */}
      <button
        id="asset-selector-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 px-3 py-2 rounded-xl text-left transition-all shadow-sm cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-slate-800 border border-slate-700">
            {getCategoryIcon(selectedAsset.category)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white font-mono">{selectedAsset.symbol}</span>
              <span className="text-xs text-slate-400 hidden sm:inline">({selectedAsset.name})</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-semibold text-slate-200">
                ${(selectedAsset.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: selectedAsset.decimals ?? 2, maximumFractionDigits: selectedAsset.decimals ?? 2 })}
              </span>
              <span
                className={`font-mono text-[11px] font-semibold ${
                  (selectedAsset.change24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {(selectedAsset.change24h ?? 0) >= 0 ? '+' : ''}
                {(selectedAsset.change24h ?? 0).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Modal Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
            {/* Search Input */}
            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={t.searchAsset}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 mt-2.5 overflow-x-auto no-scrollbar">
                {(['all', 'crypto', 'forex', 'commodity', 'stock'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat === 'all' && t.all}
                    {cat === 'crypto' && t.crypto}
                    {cat === 'forex' && t.forex}
                    {cat === 'commodity' && t.commodity}
                    {cat === 'stock' && t.stocks}
                  </button>
                ))}
              </div>
            </div>

            {/* Assets List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/40 p-1">
              {filteredAssets.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  {language === 'bn' ? 'কোনো অ্যাসেট পাওয়া যায়নি' : 'No assets found'}
                </div>
              ) : (
                filteredAssets.map((asset) => {
                  const isSelected = asset.symbol === selectedAsset.symbol;
                  const isPos = asset.change24h >= 0;
                  return (
                    <button
                      key={asset.symbol}
                      onClick={() => {
                        onSelectAsset(asset);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors text-left cursor-pointer ${
                        isSelected ? 'bg-slate-800/90 ring-1 ring-emerald-500/40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1 rounded-lg bg-slate-950 border border-slate-800">
                          {getCategoryIcon(asset.category)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-white font-mono flex items-center gap-1.5">
                            <span>{asset.symbol}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{asset.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 capitalize">
                            {asset.category}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-slate-200">
                          ${(asset.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: asset.decimals ?? 2, maximumFractionDigits: asset.decimals ?? 2 })}
                        </div>
                        <div className={`text-[11px] font-mono font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPos ? '+' : ''}{(asset.change24h ?? 0).toFixed(2)}%
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
