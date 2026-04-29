import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
mapboxgl.setTelemetryEnabled?.(false);

function LiveMapboxMap({
  pickupLat,
  pickupLng,
  driverLat,
  driverLng,
  matchedDrivers = [],
  centerLat,
  centerLng,
  darkOverlay = false,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const driverMarkerRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const multiDriverMarkersRef = useRef([]);

  const resizeObserverRef = useRef(null);
  const driverAnimationRef = useRef(null);
  const lastDriverPositionRef = useRef(null);
  const routeAnimationRef = useRef(null);
  const routeCoordinatesRef = useRef([]);
  const currentRouteIndexRef = useRef(0);

  // Функция получения маршрута от Mapbox Directions API
  const getRoute = async (from, to) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        return data.routes[0].geometry.coordinates;
      }
      return null;
    } catch (error) {
      console.error("Error fetching route:", error);
      return null;
    }
  };

  // Функция обновления позиции маркера водителя
  const updateDriverMarker = (lat, lng) => {
    if (!driverMarkerRef.current) return;
    driverMarkerRef.current.setLngLat([lng, lat]);
  };

  // Анимация движения по маршруту
  useEffect(() => {
    if (!driverLat || !driverLng || !pickupLat || !pickupLng) {
      if (routeAnimationRef.current) {
        clearInterval(routeAnimationRef.current);
        routeAnimationRef.current = null;
      }
      return;
    }

    const animateAlongRoute = async () => {
      // Получаем маршрут от текущей позиции водителя до точки посадки
      const route = await getRoute(
        { lat: driverLat, lng: driverLng },
        { lat: pickupLat, lng: pickupLng }
      );

      if (!route || route.length === 0) {
        console.warn("No route found");
        return;
      }

      routeCoordinatesRef.current = route;
      currentRouteIndexRef.current = 0;

      if (routeAnimationRef.current) {
        clearInterval(routeAnimationRef.current);
        routeAnimationRef.current = null;
      }

      // Анимируем движение по маршруту
      routeAnimationRef.current = setInterval(() => {
        if (currentRouteIndexRef.current >= routeCoordinatesRef.current.length) {
          clearInterval(routeAnimationRef.current);
          routeAnimationRef.current = null;
          return;
        }

        const [lng, lat] = routeCoordinatesRef.current[currentRouteIndexRef.current];
        updateDriverMarker(lat, lng);
        currentRouteIndexRef.current++;
      }, 100); // Обновляем каждые 100мс для плавности
    };

    animateAlongRoute();

    return () => {
      if (routeAnimationRef.current) {
        clearInterval(routeAnimationRef.current);
        routeAnimationRef.current = null;
      }
    };
  }, [driverLat, driverLng, pickupLat, pickupLng]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const fallbackCenter = [74.59, 42.87];

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style:
        import.meta.env.VITE_MAPBOX_STYLE ||
        "mapbox://styles/mapbox/streets-v12",
      center:
        pickupLng != null && pickupLat != null
          ? [pickupLng, pickupLat]
          : fallbackCenter,
      zoom: 13.5,
      attributionControl: false,
    });

    mapRef.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    mapRef.current.on("load", () => {
      const map = mapRef.current;
      if (!map) return;

      map.resize();

      if (!map.getSource("ride-route")) {
        map.addSource("ride-route", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        map.addLayer({
          id: "ride-route-line",
          type: "line",
          source: "ride-route",
          paint: {
            "line-color": "#9f3dff",
            "line-width": 6,
            "line-opacity": 0.9,
          },
        });
      }
    });

    if (typeof ResizeObserver !== "undefined") {
      resizeObserverRef.current = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      });

      resizeObserverRef.current.observe(mapContainerRef.current);
    }

    const handleWindowResize = () => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    };

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);

      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

      if (routeAnimationRef.current) {
        clearInterval(routeAnimationRef.current);
        routeAnimationRef.current = null;
      }

      if (driverAnimationRef.current) {
        cancelAnimationFrame(driverAnimationRef.current);
        driverAnimationRef.current = null;
      }

      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
        driverMarkerRef.current = null;
      }

      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.remove();
        pickupMarkerRef.current = null;
      }

      if (multiDriverMarkersRef.current.length) {
        multiDriverMarkersRef.current.forEach((marker) => marker.remove());
        multiDriverMarkersRef.current = [];
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [pickupLat, pickupLng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || pickupLat == null || pickupLng == null) return;

    const lngLat = [pickupLng, pickupLat];

    if (!pickupMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "easygo-pickup-marker";

      pickupMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat(lngLat)
        .addTo(map);
    } else {
      pickupMarkerRef.current.setLngLat(lngLat);
    }
  }, [pickupLat, pickupLng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (multiDriverMarkersRef.current.length) {
      multiDriverMarkersRef.current.forEach((marker) => marker.remove());
      multiDriverMarkersRef.current = [];
    }

    if (driverLat != null && driverLng != null) {
      return;
    }

    if (!matchedDrivers?.length) {
      return;
    }

    matchedDrivers.forEach((driver, index) => {
      if (driver?.lat == null || driver?.lng == null) return;

      const el = document.createElement("div");
      el.className = "easygo-driver-marker easygo-driver-marker-multi";
      el.innerHTML = "🚗";

      if (index === 0) {
        el.classList.add("easygo-driver-marker-best");
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([driver.lng, driver.lat])
        .addTo(map);

      multiDriverMarkersRef.current.push(marker);
    });
  }, [matchedDrivers, driverLat, driverLng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (driverLat == null || driverLng == null) {
      if (driverAnimationRef.current) {
        cancelAnimationFrame(driverAnimationRef.current);
        driverAnimationRef.current = null;
      }

      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
        driverMarkerRef.current = null;
      }

      lastDriverPositionRef.current = null;
      return;
    }

    const nextPosition = [driverLng, driverLat];

    if (!driverMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "easygo-driver-marker";
      el.innerHTML = "🚗";

      driverMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat(nextPosition)
        .addTo(map);

      lastDriverPositionRef.current = nextPosition;
      return;
    }

    if (driverAnimationRef.current) {
      cancelAnimationFrame(driverAnimationRef.current);
      driverAnimationRef.current = null;
    }

    const marker = driverMarkerRef.current;
    const currentLngLat = marker.getLngLat();

    const startLng = currentLngLat.lng;
    const startLat = currentLngLat.lat;
    const endLng = nextPosition[0];
    const endLat = nextPosition[1];

    const movedTooLittle =
      Math.abs(startLng - endLng) < 0.000001 &&
      Math.abs(startLat - endLat) < 0.000001;

    if (movedTooLittle) {
      marker.setLngLat(nextPosition);
      lastDriverPositionRef.current = nextPosition;
      return;
    }

    const duration = 900;
    let animationStart = null;

    const animateMarker = (timestamp) => {
      if (!animationStart) {
        animationStart = timestamp;
      }

      const elapsed = timestamp - animationStart;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = progress * (2 - progress);

      const lng = startLng + (endLng - startLng) * easedProgress;
      const lat = startLat + (endLat - startLat) * easedProgress;

      marker.setLngLat([lng, lat]);

      if (progress < 1) {
        driverAnimationRef.current = requestAnimationFrame(animateMarker);
      } else {
        driverAnimationRef.current = null;
        lastDriverPositionRef.current = nextPosition;
      }
    };

    driverAnimationRef.current = requestAnimationFrame(animateMarker);
  }, [driverLat, driverLng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (centerLat != null && centerLng != null) {
      map.flyTo({
        center: [centerLng, centerLat],
        zoom: 15.5,
        speed: 0.9,
        curve: 1.3,
        essential: true,
      });
      return;
    }

    if (pickupLat == null || pickupLng == null) return;

    const coordinates = [];

    if (driverLat != null && driverLng != null) {
      coordinates.push([driverLng, driverLat]);
    }

    if ((driverLat == null || driverLng == null) && matchedDrivers?.length) {
      matchedDrivers.forEach((driver) => {
        if (driver?.lat != null && driver?.lng != null) {
          coordinates.push([driver.lng, driver.lat]);
        }
      });
    }

    coordinates.push([pickupLng, pickupLat]);

    const bounds = new mapboxgl.LngLatBounds();

    coordinates.forEach((coord) => bounds.extend(coord));

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: { top: 120, right: 40, bottom: 280, left: 40 },
        duration: 1200,
        maxZoom: 15,
      });
    }
  }, [
    pickupLat,
    pickupLng,
    driverLat,
    driverLng,
    matchedDrivers,
    centerLat,
    centerLng,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const loadRoute = async () => {
      if (!map.isStyleLoaded()) return;

      if (
        pickupLat == null ||
        pickupLng == null ||
        driverLat == null ||
        driverLng == null
      ) {
        const source = map.getSource("ride-route");
        if (source) {
          source.setData({
            type: "FeatureCollection",
            features: [],
          });
        }
        return;
      }

      try {
        const token = import.meta.env.VITE_MAPBOX_TOKEN;

        const url =
          `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/` +
          `${driverLng},${driverLat};${pickupLng},${pickupLat}` +
          `?geometries=geojson&overview=full&access_token=${token}`;

        const response = await fetch(url);
        if (!response.ok) return;

        const data = await response.json();
        const route = data?.routes?.[0];
        if (!route?.geometry) return;

        const source = map.getSource("ride-route");
        if (!source) return;

        source.setData({
          type: "Feature",
          geometry: route.geometry,
          properties: {},
        });
      } catch (error) {
        console.error("Mapbox route load error:", error);
      }
    };

    if (map.isStyleLoaded()) {
      loadRoute();
    } else {
      map.once("load", loadRoute);
    }
  }, [pickupLat, pickupLng, driverLat, driverLng]);

  return (
    <div
      className="map-svg-container"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <div
        ref={mapContainerRef}
        className={`easygo-mapbox ${darkOverlay ? "easygo-mapbox--dark" : ""}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
      {darkOverlay && <div className="map-dark-overlay" />}
    </div>
  );
}

export default LiveMapboxMap;