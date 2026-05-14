const API_URL = import.meta.env.VITE_API_URL || "https://easygo-ao7f.onrender.com";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem("easygo_token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function handleJsonResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || "Request failed");
  }

  return data;
}

function getMapboxToken() {
  if (!MAPBOX_TOKEN) {
    throw new Error("VITE_MAPBOX_TOKEN не найден");
  }

  return MAPBOX_TOKEN;
}

// временно для проверки
console.log("MAPBOX_TOKEN:", MAPBOX_TOKEN);

// =========================
// CONFIG / AUTH
// =========================

export async function getConfig() {
  const response = await fetch(`${API_URL}/api/config`);
  return handleJsonResponse(response);
}

export async function requestPassengerCode(phone) {
  const response = await fetch(`${API_URL}/api/auth/passenger/request-code`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ phone }),
  });

  return handleJsonResponse(response);
}

export async function verifyPassengerCode(phone, code) {
  const response = await fetch(`${API_URL}/api/auth/passenger/verify-code`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ phone, code }),
  });

  return handleJsonResponse(response);
}

export async function loginDriverWithTunduk(iin) {
  const response = await fetch(`${API_URL}/api/auth/driver/tunduk`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ iin }),
  });

  return handleJsonResponse(response);
}

export async function getMe() {
  const response = await fetch(`${API_URL}/api/users/me`, {
    headers: getAuthHeaders(),
  });

  return handleJsonResponse(response);
}

// =========================
// RIDES
// =========================

export async function createRide(payload) {
  const response = await fetch(`${API_URL}/api/rides`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleJsonResponse(response);
}

export async function searchMatchingDrivers(payload) {
  const response = await fetch(`${API_URL}/api/rides/matches`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleJsonResponse(response);
}

export async function getCurrentRide() {
  const response = await fetch(`${API_URL}/api/rides/current`, {
    headers: getAuthHeaders(),
  });

  return handleJsonResponse(response);
}

export async function cancelCurrentRide() {
  const response = await fetch(`${API_URL}/api/rides/current/cancel`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  return handleJsonResponse(response);
}

export async function startCurrentRide() {
  const response = await fetch(`${API_URL}/api/rides/current/start`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  return handleJsonResponse(response);
}

// =========================
// SUPPORT
// =========================

export async function sendSupportMessage(text) {
  const response = await fetch(`${API_URL}/api/support/send`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ text }),
  });

  return handleJsonResponse(response);
}

export async function getSupportMessages() {
  const response = await fetch(`${API_URL}/api/support/messages`, {
    headers: getAuthHeaders(),
  });

  return handleJsonResponse(response);
}

export async function hideOldSupportMessages() {
  const response = await fetch(`${API_URL}/api/support/hide-old`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  return handleJsonResponse(response);
}

// =========================
// MAPBOX SEARCH
// =========================

const BISHKEK_PROXIMITY = "74.6122,42.8746";
const BISHKEK_BBOX = "74.45,42.80,74.72,42.93";

function mapV6FeatureToSuggestion(feature) {
  const props = feature?.properties || {};
  const coords = feature?.geometry?.coordinates || [];

  const fullName =
    props.full_address ||
    props.name ||
    feature?.place_name ||
    feature?.text ||
    "";

  const title =
    props.name ||
    fullName.split(",")[0]?.trim() ||
    "";

  const subtitle = fullName
    .split(",")
    .slice(1)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");

  return {
    id: props.mapbox_id || feature.id || fullName,
    name: title,
    subtitle,
    shortName: title,
    lat: coords[1] ?? null,
    lng: coords[0] ?? null,
  };
}

function buildSearchUrl(query, options = {}) {
  const token = getMapboxToken();

  const params = new URLSearchParams({
    q: query,
    access_token: token,
    language: "ru",
    country: "kg",
    limit: String(options.limit || 6),
    proximity: BISHKEK_PROXIMITY,
    bbox: BISHKEK_BBOX,
    autocomplete: options.autocomplete ? "true" : "false",
  });

  if (options.types) {
    params.set("types", options.types);
  }

  return `https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`;
}

function normalizeBishkekQuery(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();

  if (lower.includes("бишкек") || lower.includes("кыргызстан")) {
    return trimmed;
  }

  return `${trimmed}, Бишкек, Кыргызстан`;
}

async function requestMapboxFeatures(query, options = {}) {
  const url = buildSearchUrl(query, options);
  const response = await fetch(url);
  const data = await handleJsonResponse(response);
  return Array.isArray(data?.features) ? data.features : [];
}

export async function searchPlaces(query) {
  const trimmed = String(query || "").trim();
  if (!trimmed) {
    return { suggestions: [] };
  }

  try {
    const features = await requestMapboxFeatures(normalizeBishkekQuery(trimmed), {
      autocomplete: true,
      limit: 6,
      types: "street,address",
    });

    let suggestions = features
      .map(mapV6FeatureToSuggestion)
      .filter((item) => item.name && item.lat != null && item.lng != null);

    if (suggestions.length === 0) {
      const fallbackFeatures = await requestMapboxFeatures(
        normalizeBishkekQuery(trimmed),
        {
          autocomplete: true,
          limit: 6,
        }
      );

      suggestions = fallbackFeatures
        .map(mapV6FeatureToSuggestion)
        .filter((item) => item.name && item.lat != null && item.lng != null);
    }

    return { suggestions };
  } catch (error) {
    console.error("searchPlaces failed:", error);
    return { suggestions: [] };
  }
}

export async function geocodePlace(query) {
  const trimmed = String(query || "").trim();
  if (!trimmed) {
    return null;
  }

  const queriesToTry = [
    normalizeBishkekQuery(trimmed),
    trimmed,
  ];

  const attempts = [
    { types: "street,address", autocomplete: false, limit: 1 },
    { types: "address,street,neighborhood,locality,place", autocomplete: false, limit: 1 },
    { autocomplete: false, limit: 1 },
  ];

  for (const q of queriesToTry) {
    for (const options of attempts) {
      try {
        const features = await requestMapboxFeatures(q, options);
        const feature = features[0];

        if (!feature?.geometry?.coordinates) {
          continue;
        }

        const props = feature.properties || {};
        const coords = feature.geometry.coordinates;

        return {
          name:
            props.full_address ||
            props.name ||
            feature.place_name ||
            q,
          lat: coords[1],
          lng: coords[0],
        };
      } catch (error) {
        console.error("geocodePlace attempt failed:", q, options, error);
      }
    }
  }

  return null;
}

export async function reverseGeocodePlace(lat, lng) {
  const token = getMapboxToken();

  if (lat == null || lng == null) {
    return null;
  }

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    access_token: token,
    language: "ru",
    country: "kg",
    limit: "1",
    types: "address,street,neighborhood,place",
  });

  const url = `https://api.mapbox.com/search/geocode/v6/reverse?${params.toString()}`;

  const response = await fetch(url);
  const data = await handleJsonResponse(response);

  const feature = data?.features?.[0];
  if (!feature) {
    return null;
  }

  const props = feature.properties || {};
  const coords = feature.geometry?.coordinates || [];

  return {
    name:
      props.full_address ||
      props.name ||
      feature.place_name ||
      "Моё местоположение",
    lat: coords[1] ?? lat,
    lng: coords[0] ?? lng,
  };
}

export { API_URL };