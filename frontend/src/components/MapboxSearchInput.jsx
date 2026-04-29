import { useEffect, useRef, useState } from "react";
import "@mapbox/search-js-web";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function mapFeatureToPlace(feature) {
  const props = feature?.properties || {};
  const coords = feature?.geometry?.coordinates || [];

  const title =
    props.name ||
    props.full_address ||
    feature?.place_formatted ||
    feature?.place_name ||
    "Без названия";

  const fullText =
    props.full_address ||
    feature?.place_formatted ||
    feature?.place_name ||
    props.name ||
    title;

  let subtitle = "";

  if (fullText && title && fullText !== title) {
    subtitle = fullText.replace(title, "").replace(/^,\s*/, "").trim();
  }

  if (!subtitle) {
    subtitle = "Кыргызстан";
  }

  return {
    id: feature?.id || props.mapbox_id || `${title}-${coords[1]}-${coords[0]}`,
    mapboxId: props.mapbox_id || feature?.id || null,
    title,
    subtitle,
    fullText,
    lat: coords[1] ?? null,
    lng: coords[0] ?? null,
    type: props.feature_type || feature?.feature_type || "place",
    raw: feature,
  };
}

export default function MapboxSearchInput({
  value,
  onChange,
  onSelect,
  setDrivers,      // ← получаем из HomePage
  setShowDrivers,  // ← получаем из HomePage
  placeholder = "Введите улицу, дом или место",
}) {
  const hostRef = useRef(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || !MAPBOX_TOKEN) return;

    el.setAttribute("access-token", MAPBOX_TOKEN);
    el.setAttribute("placeholder", placeholder);

    el.options = {
      language: "ru",
      country: "KG",
      limit: 8,
      proximity: {
        lng: 74.6122,
        lat: 42.8746,
      },
    };

    el.interceptSearch = (text) => {
      const q = String(text || "").trim();
      if (!q || q.length < 2) return "";
      return q;
    };

    const handleRetrieve = (event) => {
      const feature = event?.detail?.features?.[0];
      if (!feature) return;

      const place = mapFeatureToPlace(feature);
      if (place?.lat == null || place?.lng == null) return;

      onSelect?.(place);
    };

    const handleSuggestError = (event) => {
      console.error("Mapbox SearchBox suggest error:", event);
    };

    const handleInput = (event) => {
      const nextValue =
        event?.target?.value ??
        event?.detail?.value ??
        "";
      onChange?.(nextValue);
    };

    el.addEventListener("retrieve", handleRetrieve);
    el.addEventListener("suggesterror", handleSuggestError);
    el.addEventListener("input", handleInput);

    return () => {
      el.removeEventListener("retrieve", handleRetrieve);
      el.removeEventListener("suggesterror", handleSuggestError);
      el.removeEventListener("input", handleInput);
    };
  }, [onChange, onSelect, placeholder]);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    if (typeof value === "string" && el.value !== value) {
      el.value = value;
    }
  }, [value]);

  const handleSearchDrivers = async () => {
    setIsSearching(true);
    // Имитация загрузки – фейковые водители
    const fakeDrivers = [
      {
        id: 1,
        name: "Азат",
        car: "Toyota Camry",
        price: 120,
        time: 5,
      },
      {
        id: 2,
        name: "Бек",
        car: "Honda Fit",
        price: 95,
        time: 3,
      },
    ];

    // Передаём данные в родительский компонент
    setDrivers?.(fakeDrivers);
    setShowDrivers?.(true);
    setIsSearching(false);
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="ride-input ride-input-mapbox-fallback">
        Не найден VITE_MAPBOX_TOKEN
      </div>
    );
  }

  return (
    <div className="mapbox-search-shell">
      <mapbox-search-box ref={hostRef} />

      {/* Кнопка "Искать машину" – только триггер, без внутреннего списка */}
      <button
        type="button"
        className="search-drivers-btn"
        onClick={handleSearchDrivers}
        disabled={isSearching}
      >
        {isSearching ? "Загрузка..." : "Искать машину"}
      </button>
    </div>
  );
}