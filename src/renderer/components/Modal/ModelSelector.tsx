import React, { useState, useRef, useEffect } from 'react';
import './ModelSelector.css';

interface ModelSelectorProps {
  currentProvider: string;
  currentModel: string;
  onSelect: (providerId: string, modelId: string) => void;
}

interface ProviderModels {
  id: string;
  name: string;
  models: string[];
}

export function ModelSelector({ currentProvider, currentModel, onSelect }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [providers, setProviders] = useState<ProviderModels[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && providers.length === 0) {
      loadModels();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      const providerList = await window.api.listProviders();
      const availableProviders = providerList.filter((p: any) => p.hasKey || p.id === 'ollama');

      const results = await Promise.all(
        availableProviders.map(async (p: any) => {
          try {
            const models = await window.api.listModels(p.id);
            return {
              id: p.id,
              name: p.name,
              models: models.map((m: any) => m.id),
            };
          } catch {
            return {
              id: p.id,
              name: p.name,
              models: p.models || [],
            };
          }
        })
      );

      setProviders(results.filter(p => p.models.length > 0));
    } catch (err) {
      console.error('Failed to load models:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (providerId: string, modelId: string) => {
    onSelect(providerId, modelId);
    setIsOpen(false);
  };

  const filtered = providers.map(p => ({
    ...p,
    models: p.models.filter(m => m.toLowerCase().includes(search.toLowerCase())),
  })).filter(p => p.models.length > 0);

  const displayName = `${currentProvider}/${currentModel}`;

  return (
    <div className="model-selector" ref={ref}>
      <button className="model-selector-trigger" onClick={() => setIsOpen(!isOpen)}>
        {displayName}
        <span className="model-selector-arrow">v</span>
      </button>

      {isOpen && (
        <div className="model-selector-dropdown">
          <input
            className="model-selector-search"
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="model-selector-list">
            {loading ? (
              <div className="model-loading">Loading models...</div>
            ) : (
              <>
                {filtered.map(provider => (
                  <div key={provider.id} className="model-provider-group">
                    <div className="model-provider-name">{provider.name}</div>
                    {provider.models.map(model => (
                      <button
                        key={model}
                        className={`model-option ${provider.id === currentProvider && model === currentModel ? 'active' : ''}`}
                        onClick={() => handleSelect(provider.id, model)}
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="model-empty">No models available</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
