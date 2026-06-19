import React, { useEffect, useRef } from 'react';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let mapsLoaded = false;
let mapsLoading = false;
let mapsCallbacks = [];

function loadGoogleMaps(cb) {
  if (mapsLoaded) return cb();
  mapsCallbacks.push(cb);
  if (mapsLoading) return;
  mapsLoading = true;
  window.__mapsReady = () => {
    mapsLoaded = true;
    mapsCallbacks.forEach(fn => fn());
    mapsCallbacks = [];
  };
  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&callback=__mapsReady&v=weekly`;
  s.async = true;
  document.head.appendChild(s);
}

// MapView: renders a Google Map with optional markers and a route
// Props:
//   center   { lat, lng }  – map center
//   markers  [{ lat, lng, icon, title }]
//   route    { origin: {lat,lng}, destination: {lat,lng} }
//   zoom     number (default 14)
export default function MapView({ center, markers = [], route = null, zoom = 14, style = {} }) {
  const mapRef  = useRef(null);
  const gmapRef = useRef(null);
  const pinsRef = useRef([]);
  const rendRef = useRef(null);

  useEffect(() => {
    loadGoogleMaps(() => {
      if (!mapRef.current) return;

      const gmap = new window.google.maps.Map(mapRef.current, {
        center: center || { lat: 9.0765, lng: 7.3986 }, // Abuja default
        zoom,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { elementType: 'geometry',        stylers: [{ color: '#1e2433' }] },
          { elementType: 'labels.text.fill',stylers: [{ color: '#8a94a6' }] },
          { elementType: 'labels.text.stroke',stylers:[{ color: '#1e2433' }] },
          { featureType: 'road',              elementType: 'geometry',       stylers: [{ color: '#2d3450' }] },
          { featureType: 'road',              elementType: 'geometry.stroke', stylers: [{ color: '#1a1f30' }] },
          { featureType: 'road.highway',      elementType: 'geometry',       stylers: [{ color: '#ff7a1a' }] },
          { featureType: 'water',             elementType: 'geometry',       stylers: [{ color: '#111620' }] },
          { featureType: 'poi',               elementType: 'labels',         stylers: [{ visibility: 'off' }] },
        ],
      });
      gmapRef.current = gmap;
      renderMarkers(gmap, markers);
      if (route) renderRoute(gmap, route);
    });
  }, []);

  // Update center
  useEffect(() => {
    if (gmapRef.current && center) {
      gmapRef.current.setCenter(center);
    }
  }, [center?.lat, center?.lng]);

  // Update markers
  useEffect(() => {
    if (!gmapRef.current) return;
    pinsRef.current.forEach(m => m.setMap(null));
    pinsRef.current = [];
    renderMarkers(gmapRef.current, markers);
  }, [JSON.stringify(markers)]);

  // Update route
  useEffect(() => {
    if (!gmapRef.current) return;
    if (route) renderRoute(gmapRef.current, route);
  }, [JSON.stringify(route)]);

  function renderMarkers(gmap, markers) {
    markers.forEach(m => {
      const pin = new window.google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map: gmap,
        title: m.title || '',
        icon: m.icon ? {
          url: m.icon,
          scaledSize: new window.google.maps.Size(40, 40),
        } : undefined,
        label: m.label ? {
          text: m.label,
          color: '#fff',
          fontSize: '14px',
          fontWeight: 'bold',
        } : undefined,
      });
      pinsRef.current.push(pin);
    });
  }

  function renderRoute(gmap, route) {
    if (rendRef.current) {
      rendRef.current.setMap(null);
    }
    const ds = new window.google.maps.DirectionsService();
    const dr = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#ff7a1a', strokeWeight: 5, strokeOpacity: 0.85 },
    });
    dr.setMap(gmap);
    rendRef.current = dr;
    ds.route({
      origin: route.origin,
      destination: route.destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK') dr.setDirections(result);
    });
  }

  return (
    <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 'inherit', ...style }} />
  );
}
