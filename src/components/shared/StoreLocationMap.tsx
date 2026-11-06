import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Search, CheckCircle, ExternalLink, Compass, Loader2, RefreshCw } from 'lucide-react';
import { findMozambiqueZoneCoordinates, MOZAMBIQUE_ZONES } from '../../data/mozambiqueZones';

interface StoreLocationMapProps {
  mode: 'picker' | 'view';
  storeName?: string;
  addressText?: string;
  landmarks?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  onLocationChange?: (location: { lat: number; lng: number; addressText?: string }) => void;
  height?: string;
}

// Mozambique Provincial Default Coordinates
export const MOZAMBIQUE_CITY_COORDINATES: Record<string, { lat: number; lng: number; label: string }> = {
  'Cidade de Maputo': { lat: -25.9692, lng: 32.5732, label: 'Cidade de Maputo' },
  'Província de Maputo': { lat: -25.8202, lng: 32.4632, label: 'Matola / Província de Maputo' },
  'Província de Maputo (Matola/Zimpeto/Boane)': { lat: -25.8202, lng: 32.4632, label: 'Matola / Província de Maputo' },
  'Gaza': { lat: -25.0519, lng: 33.6442, label: 'Xai-Xai, Gaza' },
  'Gaza (Xai-Xai)': { lat: -25.0519, lng: 33.6442, label: 'Xai-Xai, Gaza' },
  'Inhambane': { lat: -23.8650, lng: 35.3833, label: 'Cidade de Inhambane' },
  'Inhambane (Cidade de Inhambane)': { lat: -23.8650, lng: 35.3833, label: 'Cidade de Inhambane' },
  'Sofala': { lat: -19.8436, lng: 34.8389, label: 'Cidade da Beira, Sofala' },
  'Sofala (Cidade da Beira)': { lat: -19.8436, lng: 34.8389, label: 'Cidade da Beira, Sofala' },
  'Manica': { lat: -19.1164, lng: 33.4833, label: 'Chimoio, Manica' },
  'Manica (Chimoio)': { lat: -19.1164, lng: 33.4833, label: 'Chimoio, Manica' },
  'Tete': { lat: -16.1564, lng: 33.5862, label: 'Cidade de Tete' },
  'Tete (Cidade de Tete)': { lat: -16.1564, lng: 33.5862, label: 'Cidade de Tete' },
  'Zambézia': { lat: -17.8786, lng: 36.8883, label: 'Quelimane, Zambézia' },
  'Zambézia (Quelimane)': { lat: -17.8786, lng: 36.8883, label: 'Quelimane, Zambézia' },
  'Nampula': { lat: -15.1165, lng: 39.2666, label: 'Cidade de Nampula' },
  'Nampula (Cidade de Nampula)': { lat: -15.1165, lng: 39.2666, label: 'Cidade de Nampula' },
  'Cabo Delgado': { lat: -12.9740, lng: 40.5178, label: 'Pemba, Cabo Delgado' },
  'Cabo Delgado (Pemba)': { lat: -12.9740, lng: 40.5178, label: 'Pemba, Cabo Delgado' },
  'Niassa': { lat: -13.3131, lng: 35.2406, label: 'Lichinga, Niassa' },
  'Niassa (Lichinga)': { lat: -13.3131, lng: 35.2406, label: 'Lichinga, Niassa' },
};

const DEFAULT_MAPUTO_LAT = -25.9692;
const DEFAULT_MAPUTO_LNG = 32.5732;

export default function StoreLocationMap({
  mode = 'view',
  storeName = 'Estabelecimento',
  addressText = 'Maputo, Moçambique',
  landmarks = '',
  province = 'Cidade de Maputo',
  latitude,
  longitude,
  onLocationChange,
  height = '280px'
}: StoreLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Determine initial coordinates based on province if lat/lng are not explicitly passed
  const getInitialLat = useCallback(() => {
    if (typeof latitude === 'number' && !isNaN(latitude)) return latitude;
    const provCoord = province ? MOZAMBIQUE_CITY_COORDINATES[province] : null;
    return provCoord ? provCoord.lat : DEFAULT_MAPUTO_LAT;
  }, [latitude, province]);

  const getInitialLng = useCallback(() => {
    if (typeof longitude === 'number' && !isNaN(longitude)) return longitude;
    const provCoord = province ? MOZAMBIQUE_CITY_COORDINATES[province] : null;
    return provCoord ? provCoord.lng : DEFAULT_MAPUTO_LNG;
  }, [longitude, province]);

  const [currentLat, setCurrentLat] = useState<number>(getInitialLat());
  const [currentLng, setCurrentLng] = useState<number>(getInitialLng());
  const [searchQuery, setSearchQuery] = useState<string>(addressText || '');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof latitude === 'number' && !isNaN(latitude) && typeof longitude === 'number' && !isNaN(longitude)) {
      setCurrentLat(latitude);
      setCurrentLng(longitude);
    } else if (province && MOZAMBIQUE_CITY_COORDINATES[province]) {
      const cityCoords = MOZAMBIQUE_CITY_COORDINATES[province];
      setCurrentLat(cityCoords.lat);
      setCurrentLng(cityCoords.lng);
    }
  }, [latitude, longitude, province]);

  useEffect(() => {
    if (addressText && !searchQuery) {
      setSearchQuery(addressText);
    }
  }, [addressText]);

  // Leaflet Map Initialization & Updates with robust container safety
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Safety: if container was already initialized by Leaflet elsewhere, clean it up
    if ((container as any)._leaflet_id && !mapInstanceRef.current) {
      delete (container as any)._leaflet_id;
    }

    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          background-color: #D9553F;
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background-color: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    const popupHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; line-height: 1.4; color: #1E293B; min-width: 160px;">
        <strong style="color: #0B4A46; font-size: 13px; display: block; margin-bottom: 2px;">${storeName || 'Loja'}</strong>
        <div style="color: #334155;">${addressText || 'Maputo'}</div>
        ${landmarks ? `<div style="color: #64748B; font-size: 11px; margin-top: 3px; font-style: italic;">Ref: ${landmarks}</div>` : ''}
      </div>
    `;

    if (!mapInstanceRef.current) {
      try {
        const map = L.map(container, {
          center: [currentLat, currentLng],
          zoom: 15,
          zoomControl: true,
          attributionControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
          maxZoom: 19
        }).addTo(map);

        const marker = L.marker([currentLat, currentLng], {
          icon: customIcon,
          draggable: mode === 'picker'
        }).addTo(map);

        marker.bindPopup(popupHtml);

        if (mode === 'picker') {
          marker.on('dragend', () => {
            const newPos = marker.getLatLng();
            setCurrentLat(newPos.lat);
            setCurrentLng(newPos.lng);
            if (onLocationChange) {
              onLocationChange({ lat: newPos.lat, lng: newPos.lng, addressText: searchQuery });
            }
          });

          map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            setCurrentLat(lat);
            setCurrentLng(lng);
            if (onLocationChange) {
              onLocationChange({ lat, lng, addressText: searchQuery });
            }
          });
        }

        mapInstanceRef.current = map;
        markerRef.current = marker;
      } catch (err) {
        console.warn('Leaflet map initialization warning:', err);
      }
    } else {
      // Map instance already exists, update position and view
      try {
        mapInstanceRef.current.setView([currentLat, currentLng], 15);
        if (markerRef.current) {
          markerRef.current.setLatLng([currentLat, currentLng]);
          markerRef.current.setPopupContent(popupHtml);
        }
      } catch (err) {
        console.warn('Leaflet update warning:', err);
      }
    }

    // Force map to recalculate container dimensions when rendering in dialogs/tabs
    const timers = [
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50),
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200),
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 600)
    ];

    let resizeObserver: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        mapInstanceRef.current?.invalidateSize();
      });
      resizeObserver.observe(container);
    }

    return () => {
      timers.forEach(clearTimeout);
      if (resizeObserver && container) {
        resizeObserver.unobserve(container);
      }
    };
  }, [currentLat, currentLng, mode, storeName, addressText, landmarks, searchQuery, onLocationChange]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // ignore
        }
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  // Geocode with Local High-Precision Dictionary + Nominatim Fallback
  const handleGeocodeSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const qToSearch = (customQuery !== undefined ? customQuery : searchQuery).trim();
    if (!qToSearch) return;

    setIsSearching(true);
    setSearchStatus('A localizar endereço em Moçambique...');

    // 1. FAST PATH: Check local Mozambique zones and landmarks dictionary (Instant & Exact)
    const localMatch = findMozambiqueZoneCoordinates(qToSearch);
    if (localMatch) {
      const foundLat = localMatch.lat;
      const foundLng = localMatch.lng;
      setCurrentLat(foundLat);
      setCurrentLng(foundLng);
      setSearchStatus(`✅ Zona localizada com precisão: ${localMatch.matchedZone.name} (${localMatch.matchedZone.municipality})`);

      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setView([foundLat, foundLng], 16);
        markerRef.current.setLatLng([foundLat, foundLng]);
      }

      if (onLocationChange) {
        onLocationChange({ lat: foundLat, lng: foundLng, addressText: qToSearch });
      }
      setIsSearching(false);
      return;
    }

    // 2. REMOTE PATH: OpenStreetMap Nominatim with Mozambique bounds
    try {
      let cleanAddress = qToSearch
        .replace(/\b(perto|junto|ao|lado|em|frente|da|do|de)\b/gi, '')
        .trim();

      const queriesToTry = [
        `${cleanAddress}, Maputo, Moçambique`,
        `${cleanAddress}, Moçambique`,
        cleanAddress
      ];

      let found = false;

      for (const tryQuery of queriesToTry) {
        if (found) break;
        try {
          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(tryQuery)}&countrycodes=mz&format=json&limit=1&viewbox=32.2,-25.6,32.9,-26.1`;
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'AxofacilMaputoApp/1.0 (tarira.ecossistema@gmail.com)'
            }
          });

          if (!response.ok) continue;
          const data = await response.json();

          if (data && data.length > 0) {
            const foundLat = parseFloat(data[0].lat);
            const foundLng = parseFloat(data[0].lon);

            setCurrentLat(foundLat);
            setCurrentLng(foundLng);
            setSearchStatus(`✅ Localização encontrada no mapa! (${foundLat.toFixed(5)}, ${foundLng.toFixed(5)})`);

            if (mapInstanceRef.current && markerRef.current) {
              mapInstanceRef.current.setView([foundLat, foundLng], 16);
              markerRef.current.setLatLng([foundLat, foundLng]);
            }

            if (onLocationChange) {
              onLocationChange({ lat: foundLat, lng: foundLng, addressText: qToSearch });
            }
            found = true;
            break;
          }
        } catch (innerErr) {
          // try next query
        }
      }

      if (!found) {
        // Fallback: apply province center so user is positioned in the right city
        const provCoord = province ? MOZAMBIQUE_CITY_COORDINATES[province] : null;
        if (provCoord) {
          setCurrentLat(provCoord.lat);
          setCurrentLng(provCoord.lng);
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([provCoord.lat, provCoord.lng], 14);
            markerRef.current.setLatLng([provCoord.lat, provCoord.lng]);
          }
        }
        setSearchStatus('📍 Centrado na região. Pode clicar diretamente no mapa ou arrastar o pino vermelho para o local exato da sua loja.');
      }
    } catch (err) {
      console.error('Nominatim Geocoding error:', err);
      setSearchStatus('📍 Posicione o marcador diretamente no mapa clicando no ponto pretendido.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectQuickZone = (zone: typeof MOZAMBIQUE_ZONES[0]) => {
    setSearchQuery(zone.name);
    handleGeocodeSearch(undefined, zone.name);
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${currentLat},${currentLng}`;
  const wazeUrl = `https://waze.com/ul?ll=${currentLat},${currentLng}&navigate=yes`;

  // Quick selection zones for Maputo & Matola
  const POPULAR_ZONES = [
    'Polana Cimento A',
    'Central A (Baixa de Maputo)',
    'Alto Maé A',
    'Malhangalene A',
    'Costa do Sol',
    'Triunfo (Triunfo Novo & Velho)',
    'Zimpeto (Estádio & Mercado Grossista)',
    'Matola A (Matola Centro / Vila)',
    'Fomento',
    'Machava Sede',
    'Boane Vila & Estaleiros'
  ];

  return (
    <div className="space-y-4 w-full">
      
      {/* Search Input for Registration / Editing Mode */}
      {mode === 'picker' && (
        <div className="space-y-3 bg-slate-900 text-white p-4 rounded-2xl border border-slate-700 shadow-md">
          <label className="block text-xs font-bold text-emerald-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-400" />
              <span>Pesquisar Endereço / Bairro / Referência em Moçambique</span>
            </span>
            <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
              GPS Maputo & Matola
            </span>
          </label>

          <div className="flex gap-2">
            <div className="relative flex-grow">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleGeocodeSearch();
                  }
                }}
                placeholder="ex: Polana, Costa do Sol, Baixa, Machava, Av. 24 de Julho..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-600 rounded-xl text-xs font-medium outline-none focus:border-emerald-400 text-white placeholder:text-slate-400"
              />
            </div>
            <button
              type="button"
              onClick={() => handleGeocodeSearch()}
              disabled={isSearching}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-md shrink-0 active:scale-95"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Search className="w-4 h-4" />}
              <span>Localizar</span>
            </button>
          </div>

          {/* Quick Zone Chips for Maputo and Matola */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
              Zonas & Bairros Populares (Clique para centrar instantaneamente):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_ZONES.map((zoneName) => {
                const zoneObj = MOZAMBIQUE_ZONES.find(z => z.name === zoneName);
                if (!zoneObj) return null;
                return (
                  <button
                    key={zoneName}
                    type="button"
                    onClick={() => selectQuickZone(zoneObj)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 active:text-slate-950 text-slate-200 text-[10.5px] font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  >
                    📍 {zoneName.split('(')[0].trim()}
                  </button>
                );
              })}
            </div>
          </div>

          {searchStatus && (
            <p className="text-[11px] font-medium text-emerald-300 flex items-center gap-1.5 pt-0.5">
              <span>{searchStatus}</span>
            </p>
          )}

          <div className="text-[10.5px] text-slate-300 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/80">
            📍 <strong>Ajuste Fácil:</strong> Clique em qualquer ponto do mapa ou arraste o pino para indicar a porta exata do estabelecimento.
          </div>
        </div>
      )}

      {/* Leaflet OpenStreetMap Container with Modern Differentiated Cartographic Frame */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 bg-[#0d1627] shadow-xl group">
        
        {/* Top Cartographic Header Ribbon */}
        <div className="bg-slate-950/95 backdrop-blur-md px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-white z-20 relative">
          <div className="flex items-center gap-2 max-w-[75%] truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="font-bold text-white truncate text-[11.5px]">{storeName || 'Estabelecimento'}</span>
            <span className="text-slate-400 hidden sm:inline text-[11px]">· {province || 'Moçambique'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.invalidateSize()}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10.5px] font-bold border border-slate-600 cursor-pointer flex items-center gap-1 transition-colors"
              title="Ajustar visualização do mapa"
            >
              <RefreshCw className="w-3 h-3 text-blue-400" />
              <span className="hidden sm:inline">Centrar</span>
            </button>
          </div>
        </div>

        {/* Map Canvas */}
        <div
          ref={mapContainerRef}
          style={{ height: height, minHeight: '220px', width: '100%' }}
          className="z-10 w-full"
        />

        {/* Bottom Floating Coords Badge */}
        <div className="absolute bottom-2.5 left-3 z-20 bg-slate-950/90 backdrop-blur-md text-emerald-300 px-3 py-1 rounded-lg border border-emerald-500/30 text-[10.5px] font-mono shadow-md flex items-center gap-1.5">
          <span className="text-blue-400 font-bold">GPS:</span>
          <span>{currentLat.toFixed(5)}, {currentLng.toFixed(5)}</span>
        </div>
      </div>

      {/* Customer Navigation "Como Chegar" Links - Differentiated, High-Contrast & Premium Design */}
      {mode === 'view' && (
        <div className="bg-gradient-to-br from-slate-900 via-[#131d31] to-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-lg space-y-3.5 text-white">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                  Como Chegar (Navegação GPS em Tempo Real)
                </h4>
                <p className="text-[10.5px] text-slate-300">
                  Abra no seu aplicativo preferido para traçar a rota com voz e trânsito
                </p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
              Direto no Telemóvel
            </span>
          </div>

          {/* Action Links Grid: Google Maps & Waze with Pristine Distinction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            
            {/* Google Maps Action Card */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center justify-between gap-2.5 shadow-md group border border-blue-400/30 hover:scale-[1.02] active:scale-95"
              title="Traçar rota no Google Maps"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white text-blue-700 flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                  G
                </div>
                <div className="text-left">
                  <div className="font-extrabold text-white text-[12px] leading-tight">Google Maps</div>
                  <div className="text-[10px] text-blue-100 font-normal">Ver Rota, Tempo & Trânsito</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-200 group-hover:text-white transition-colors shrink-0" />
            </a>

            {/* Waze Action Card */}
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center justify-between gap-2.5 shadow-md group border border-cyan-400/30 hover:scale-[1.02] active:scale-95"
              title="Navegar com alertas no Waze"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white text-sky-600 flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                  W
                </div>
                <div className="text-left">
                  <div className="font-extrabold text-white text-[12px] leading-tight">Waze GPS</div>
                  <div className="text-[10px] text-cyan-100 font-normal">Alertas de Trânsito & Polícia</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-cyan-200 group-hover:text-white transition-colors shrink-0" />
            </a>
          </div>

          {/* Landmarks / Ponto de Referência with High Contrast */}
          {landmarks && (
            <div className="text-xs text-slate-200 bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-start gap-2">
              <span className="bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider shrink-0 mt-0.5 border border-blue-500/30">
                Ponto de Referência
              </span>
              <span className="leading-relaxed text-slate-200 text-[11.5px]">{landmarks}</span>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
