import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Linking, ActivityIndicator, Platform, RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import {
  MapPin, Phone, Navigation, Star, Clock,
  Hospital, Pill, Stethoscope, RefreshCw, LocateFixed, AlertCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '@/components/Card';
import { colors } from '@/constants/colors';
import { radius, shadows, spacing, typography } from '@/constants/theme';

// â”€â”€â”€ TYPES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type Category = 'all' | 'hospitals' | 'clinics' | 'pharmacies';

interface Place {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: Category;
  distance: number;
  phone?: string;
  website?: string;
  emergency?: boolean;
}

// â”€â”€â”€ DISTANCE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}

// â”€â”€â”€ OVERPASS API (free, no key) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function fetchOverpass(lat: number, lng: number, radiusM = 5000): Promise<Place[]> {
  // Query hospitals, clinics, doctors, pharmacies within radius
  const query = `
[out:json][timeout:20];
(
  node["amenity"~"^(hospital|clinic|doctors|pharmacy|dentist|health_centre)$"](around:${radiusM},${lat},${lng});
  way["amenity"~"^(hospital|clinic|doctors|pharmacy|dentist|health_centre)$"](around:${radiusM},${lat},${lng});
  relation["amenity"~"^(hospital|clinic|doctors|pharmacy|dentist|health_centre)$"](around:${radiusM},${lat},${lng});
);
out center tags 30;
  `.trim();

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) throw new Error('Overpass API error');
  const data = await res.json();

  return (data.elements || [])
    .map((el: any): Place | null => {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (!elLat || !elLng) return null;

      const tags    = el.tags || {};
      const amenity = tags.amenity || '';
      const name    = tags.name || tags['name:en'] || tags['operator'] || formatAmenity(amenity);

      // Map amenity â†’ category
      let category: Category = 'clinics';
      if (amenity === 'hospital')                          category = 'hospitals';
      if (amenity === 'pharmacy')                          category = 'pharmacies';
      if (amenity === 'clinic' || amenity === 'doctors' ||
          amenity === 'dentist' || amenity === 'health_centre') category = 'clinics';

      // Build address
      const addrParts = [
        tags['addr:housenumber'],
        tags['addr:street'],
        tags['addr:suburb'] || tags['addr:city'],
      ].filter(Boolean);
      const address = addrParts.length > 0 ? addrParts.join(', ') : tags['addr:full'] || '';

      return {
        id:        String(el.id),
        name,
        address,
        lat:       elLat,
        lng:       elLng,
        category,
        distance:  haversine(lat, lng, elLat, elLng),
        phone:     tags.phone || tags['contact:phone'],
        website:   tags.website || tags['contact:website'],
        emergency: tags.emergency === 'yes' || amenity === 'hospital',
      };
    })
    .filter(Boolean)
    .sort((a: Place, b: Place) => a.distance - b.distance) as Place[];
}

function formatAmenity(a: string): string {
  const map: Record<string, string> = {
    hospital:      'Hospital',
    clinic:        'Clinic',
    doctors:       'Doctor',
    pharmacy:      'Pharmacy',
    dentist:       'Dental Clinic',
    health_centre: 'Health Centre',
  };
  return map[a] || 'Medical Facility';
}

// â”€â”€â”€ NOMINATIM REVERSE GEOCODE (free) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'HosFind/1.0' } }
    );
    const data = await res.json();
    const a    = data.address || {};
    return (
      a.suburb || a.neighbourhood || a.quarter ||
      a.city_district || a.town || a.city || a.county || 'Your Location'
    );
  } catch {
    return 'Your Location';
  }
}

// â”€â”€â”€ MAP HTML (Leaflet + OSM tiles — fully free) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function buildMapHTML(userLat: number, userLng: number, places: Place[], selectedPlace: Place | null): string {
  const markers = places.slice(0, 25).map(p => {
    const color = p.category === 'hospitals'
      ? '#EF4444' : p.category === 'pharmacies'
      ? '#10B981' : '#2563EB';
    const safeN = p.name.replace(/['"\\]/g, ' ');
    const safeA = p.address.replace(/['"\\]/g, ' ');
    return `L.marker([${p.lat},${p.lng}],{icon:L.divIcon({className:'',html:'<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>',iconSize:[26,26],iconAnchor:[13,26]})}).addTo(map).bindPopup('<b>${safeN}</b>${safeA ? '<br><small>' + safeA + '</small>' : ''}').on('click',function(){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'marker',id:'${p.id}'}));parent&&parent.postMessage(JSON.stringify({type:'marker',id:'${p.id}'}),'*');});`;
  }).join('\n');

  // If a place is selected, draw a walking/driving route using OSRM (free)
  const routeScript = selectedPlace ? `
// Draw route to selected place using OSRM (free routing)
var routeLayer = null;
function drawRoute() {
  var url = 'https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${selectedPlace.lng},${selectedPlace.lat}?overview=full&geometries=geojson';
  fetch(url).then(function(r){return r.json();}).then(function(data){
    if(routeLayer) map.removeLayer(routeLayer);
    if(data.routes && data.routes[0]) {
      var coords = data.routes[0].geometry.coordinates.map(function(c){return [c[1],c[0]];});
      routeLayer = L.polyline(coords, {color:'#2563EB',weight:5,opacity:0.85,dashArray:'8,4'}).addTo(map);
      // Fit map to show full route
      var bounds = L.latLngBounds([[${userLat},${userLng}],[${selectedPlace.lat},${selectedPlace.lng}]]);
      map.fitBounds(bounds.pad(0.2));
      // Show distance/duration info
      var dist = (data.routes[0].distance/1000).toFixed(1);
      var dur  = Math.round(data.routes[0].duration/60);
      var info = L.popup().setLatLng([${selectedPlace.lat},${selectedPlace.lng}]).setContent('<b>${selectedPlace.name.replace(/['"\\]/g, ' ')}</b><br>🚗 '+dist+' km · '+dur+' min').openOn(map);
    }
  }).catch(function(){
    // Fallback: straight line
    if(routeLayer) map.removeLayer(routeLayer);
    routeLayer = L.polyline([[${userLat},${userLng}],[${selectedPlace.lat},${selectedPlace.lng}]],{color:'#2563EB',weight:4,opacity:0.7,dashArray:'6,4'}).addTo(map);
    map.fitBounds([[${userLat},${userLng}],[${selectedPlace.lat},${selectedPlace.lng}]],{padding:[40,40]});
  });
}
drawRoute();
` : '';

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%}
  .leaflet-control-attribution{font-size:9px;opacity:0.6}
  .leaflet-popup-content{font-size:13px;line-height:1.5}
</style>
</head><body><div id="map"></div>
<script>
var map=L.map('map',{zoomControl:true}).setView([${userLat},${userLng}],14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
// User location
L.marker([${userLat},${userLng}],{icon:L.divIcon({className:'',html:'<div style="width:18px;height:18px;border-radius:50%;background:#7C3AED;border:3px solid white;box-shadow:0 0 0 5px rgba(124,58,237,0.25)"></div>',iconSize:[18,18],iconAnchor:[9,9],zIndexOffset:1000})}).addTo(map).bindPopup('<b>ðŸ“ You are here</b>');
${markers}
${routeScript}
</script></body></html>`;
}

// â”€â”€â”€ FILTERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const FILTERS: { label: string; key: Category; icon: any }[] = [
  { label: 'All',        key: 'all',        icon: MapPin       },
  { label: 'Hospitals',  key: 'hospitals',  icon: Hospital     },
  { label: 'Clinics',    key: 'clinics',    icon: Stethoscope  },
  { label: 'Pharmacies', key: 'pharmacies', icon: Pill         },
];

// â”€â”€â”€ COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function MapScreen() {
  const [coords,       setCoords]       = useState<{ lat: number; lng: number } | null>(null);
  const [allPlaces,    setAllPlaces]    = useState<Place[]>([]);
  const [filter,       setFilter]       = useState<Category>('all');
  const [selected,     setSelected]     = useState<Place | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [refreshing,   setRefreshing]   = useState(false);
  const [areaName,     setAreaName]     = useState('Detecting location...');
  const [mapHtml,      setMapHtml]      = useState('');
  const [routeInfo,    setRouteInfo]    = useState<{ dist: string; dur: string } | null>(null);

  // â”€â”€ Get GPS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const getCoords = useCallback(async (): Promise<{ lat: number; lng: number }> => {
    if (Platform.OS === 'web') {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
        navigator.geolocation.getCurrentPosition(
          p  => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          _e => reject(new Error('Location denied')),
          { timeout: 10000, enableHighAccuracy: true }
        );
      });
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Location permission denied');
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }, []);

  // â”€â”€ Load everything â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setSelected(null);
    setRouteInfo(null);
    try {
      const loc = await getCoords();
      setCoords(loc);
      const [name, places] = await Promise.all([
        reverseGeocode(loc.lat, loc.lng),
        fetchOverpass(loc.lat, loc.lng, 5000),
      ]);
      setAreaName(name);
      setAllPlaces(places);
      setMapHtml(buildMapHTML(loc.lat, loc.lng, places, null));
    } catch (err: any) {
      setError(err.message || 'Could not load map data');
    } finally {
      setLoading(false);
    }
  }, [getCoords]);

  // Fetch OSRM route info when a place is selected
  const selectPlace = useCallback(async (place: Place | null) => {
    setSelected(place);
    setRouteInfo(null);
    if (!place || !coords) return;

    // Rebuild map with route
    setMapHtml(buildMapHTML(coords.lat, coords.lng, allPlaces, place));

    // Fetch route distance/duration from OSRM
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${coords.lng},${coords.lat};${place.lng},${place.lat}?overview=false`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.routes?.[0]) {
        setRouteInfo({
          dist: (data.routes[0].distance / 1000).toFixed(1),
          dur:  String(Math.round(data.routes[0].duration / 60)),
        });
      }
    } catch {
      // Route info unavailable — not critical
    }
  }, [coords, allPlaces]);

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // â”€â”€ Filtered list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const filtered = filter === 'all'
    ? allPlaces
    : allPlaces.filter(p => p.category === filter);

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <LinearGradient colors={['#0F766E', '#0D9488']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Nearby Healthcare</Text>
            <View style={styles.locationRow}>
              <LocateFixed size={12} color="rgba(255,255,255,0.8)" />
              <Text style={styles.headerSub}>
                {areaName} · {filtered.length} found
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} disabled={loading}>
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <RefreshCw size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filter chips */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {FILTERS.map(({ label, key, icon: Icon }) => (
            <TouchableOpacity
              key={key}
              style={[styles.chip, filter === key && styles.chipActive]}
              onPress={() => { setFilter(key); setSelected(null); }}
              activeOpacity={0.8}
            >
              <Icon size={14} color={filter === key ? '#fff' : colors.textSecondary} />
              <Text style={[styles.chipText, filter === key && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Map */}
      <View style={styles.mapWrap}>
        {mapHtml ? (
          Platform.OS === 'web' ? (
            <iframe
              srcDoc={mapHtml}
              style={{ width: '100%', height: '100%', border: 'none' } as any}
              scrolling="no"
            />
          ) : (
            (() => {
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              const RNWebView = require('react-native-webview').WebView;
              return <RNWebView source={{ html: mapHtml }} style={{ flex: 1 }} javaScriptEnabled originWhitelist={['*']} />;
            })()
          )
        ) : (
          <View style={styles.mapLoader}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.mapLoaderText}>Loading map…</Text>
          </View>
        )}

        {/* Legend */}
        {mapHtml ? (
          <View style={styles.legend}>
            {[
              { color: '#EF4444', label: 'Hospital' },
              { color: '#2563EB', label: 'Clinic'   },
              { color: '#10B981', label: 'Pharmacy' },
            ].map(l => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendText}>{l.label}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* Error banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <AlertCircle size={14} color={colors.emergency} />
          <Text style={styles.errorText} numberOfLines={1}>{error}</Text>
          <TouchableOpacity onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Results list */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <Text style={styles.listTitle}>
          {loading
            ? 'Searching nearby…'
            : filtered.length > 0
              ? `${filtered.length} Facilities Found`
              : 'No facilities found'}
        </Text>

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Finding healthcare near you…</Text>
          </View>
        )}

        {!loading && filtered.length === 0 && !error && (
          <View style={styles.emptyWrap}>
            <MapPin size={40} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Nothing found nearby</Text>
            <Text style={styles.emptySubtitle}>Try a different filter or pull to refresh</Text>
          </View>
        )}

        {filtered.map(h => (
          <TouchableOpacity
            key={h.id}
            activeOpacity={0.9}
            onPress={() => selectPlace(selected?.id === h.id ? null : h)}
          >
            <Card style={[styles.card, selected?.id === h.id && styles.cardSelected]}>
              <View style={styles.cardTop}>
                {/* Icon */}
                <View style={[styles.typeIcon, {
                  backgroundColor:
                    h.category === 'hospitals'  ? colors.emergencyLight :
                    h.category === 'pharmacies' ? colors.secondaryLight : colors.primaryLight,
                }]}>
                  {h.category === 'hospitals'  ? <Hospital    size={18} color={colors.emergency} /> :
                   h.category === 'pharmacies' ? <Pill        size={18} color={colors.secondary} /> :
                                                 <Stethoscope size={18} color={colors.primary}   />}
                </View>

                {/* Info */}
                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{h.name}</Text>
                    {h.emergency && (
                      <View style={styles.emergencyBadge}>
                        <Text style={styles.emergencyBadgeText}>24/7</Text>
                      </View>
                    )}
                  </View>
                  {h.address ? (
                    <Text style={styles.address} numberOfLines={1}>{h.address}</Text>
                  ) : null}
                  <View style={styles.meta}>
                    <View style={styles.distRow}>
                      <MapPin size={11} color={colors.textSecondary} />
                      <Text style={styles.dist}>{h.distance} km</Text>
                    </View>
                    <View style={[styles.catBadge, {
                      backgroundColor:
                        h.category === 'hospitals'  ? colors.emergencyLight :
                        h.category === 'pharmacies' ? colors.secondaryLight : colors.primaryLight,
                    }]}>
                      <Text style={[styles.catText, {
                        color:
                          h.category === 'hospitals'  ? colors.emergency :
                          h.category === 'pharmacies' ? colors.secondary : colors.primary,
                      }]}>
                        {h.category === 'hospitals' ? 'Hospital' : h.category === 'pharmacies' ? 'Pharmacy' : 'Clinic'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Expanded — in-app route info */}
              {selected?.id === h.id && (
                <View style={styles.expanded}>
                  {/* Route info bar */}
                  {routeInfo && (
                    <View style={styles.routeBar}>
                      <View style={styles.routeStat}>
                        <Text style={styles.routeVal}>{routeInfo.dist} km</Text>
                        <Text style={styles.routeLabel}>Distance</Text>
                      </View>
                      <View style={styles.routeDivider} />
                      <View style={styles.routeStat}>
                        <Text style={styles.routeVal}>{routeInfo.dur} min</Text>
                        <Text style={styles.routeLabel}>By car</Text>
                      </View>
                      <View style={styles.routeDivider} />
                      <View style={styles.routeStat}>
                        <Text style={styles.routeVal}>{h.distance} km</Text>
                        <Text style={styles.routeLabel}>Straight line</Text>
                      </View>
                    </View>
                  )}

                  {/* Action buttons — all in-app */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.dirBtn}
                      onPress={() => selectPlace(h)}
                    >
                      <Navigation size={15} color={colors.primary} />
                      <Text style={styles.dirBtnText}>Show Route</Text>
                    </TouchableOpacity>

                    {h.phone && (
                      <TouchableOpacity
                        style={styles.callBtn}
                        onPress={() => Linking.openURL(`tel:${h.phone}`)}
                      >
                        <Phone size={15} color="#fff" />
                        <Text style={styles.callBtnText}>Call</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.closeBtn}
                      onPress={() => selectPlace(null)}
                    >
                      <Text style={styles.closeBtnText}>✕ Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Card>
          </TouchableOpacity>
        ))}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// â”€â”€â”€ STYLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: { paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  filterBar: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterContent: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm, gap: spacing.sm, flexDirection: 'row' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radius.full, backgroundColor: colors.borderLight,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#fff' },

  mapWrap: { height: 230, position: 'relative', backgroundColor: '#e8f4fd' },
  mapLoader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  mapLoaderText: { color: colors.textSecondary, fontSize: 13 },
  legend: {
    position: 'absolute', bottom: spacing.sm, right: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.md, padding: spacing.sm,
    gap: 4, ...shadows.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: colors.text, fontWeight: '500' },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.emergencyLight,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.emergency,
  },
  errorText: { flex: 1, color: colors.emergency, fontSize: 12 },
  retryText: { color: colors.primary, fontWeight: '700', fontSize: 13 },

  list: { flex: 1, paddingHorizontal: spacing.base },
  listTitle: { ...typography.h4, color: colors.text, marginVertical: spacing.md },

  loadingWrap: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.md },
  loadingText: { color: colors.textSecondary, fontSize: 14 },

  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.sm },
  emptyTitle: { ...typography.h4, color: colors.textSecondary },
  emptySubtitle: { ...typography.bodySmall, color: colors.textTertiary, textAlign: 'center' },

  card: { marginBottom: spacing.md, padding: spacing.base },
  cardSelected: { borderWidth: 1.5, borderColor: colors.primary },
  cardTop: { flexDirection: 'row', gap: spacing.md },
  typeIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { ...typography.h4, color: colors.text, flex: 1 },
  emergencyBadge: { backgroundColor: colors.emergencyLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  emergencyBadgeText: { fontSize: 10, fontWeight: '700', color: colors.emergency },
  address: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dist: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  catBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  catText: { fontSize: 11, fontWeight: '600' },

  expanded: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  routeBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    paddingVertical: spacing.md, marginBottom: spacing.md,
  },
  routeStat: { alignItems: 'center', flex: 1 },
  routeVal: { fontSize: 16, fontWeight: '800', color: colors.primary },
  routeLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  routeDivider: { width: 1, height: 32, backgroundColor: colors.border },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  dirBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: colors.primaryLight,
    paddingVertical: spacing.md, borderRadius: radius.md,
  },
  dirBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: colors.secondary,
    paddingVertical: spacing.md, paddingHorizontal: spacing.base, borderRadius: radius.md,
  },
  callBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  closeBtn: {
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderRadius: radius.md, backgroundColor: colors.borderLight,
    borderWidth: 1, borderColor: colors.border,
  },
  closeBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
});






