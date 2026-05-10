const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

const form = document.getElementById("search-form");
const cityInput = document.getElementById("city");
const submitBtn = document.getElementById("submit-btn");
const resultEl = document.getElementById("result");
const errorEl = document.getElementById("error");

const placeName = document.getElementById("place-name");
const placeDetail = document.getElementById("place-detail");
const tempEl = document.getElementById("temp");
const unitEl = document.getElementById("unit");
const conditionEl = document.getElementById("condition");
const feelsEl = document.getElementById("feels");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");

/** WMO Weather interpretation codes (WW) — subset for current conditions */
function weatherLabel(code) {
  const map = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return map[code] ?? `Weather code ${code}`;
}

function hideError() {
  errorEl.hidden = true;
  errorEl.textContent = "";
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
  resultEl.hidden = true;
}

async function geocodeCity(query) {
  const params = new URLSearchParams({
    name: query.trim(),
    count: "5",
    language: "en",
    format: "json",
  });
  const res = await fetch(`${GEO_URL}?${params}`);
  if (!res.ok) throw new Error("Could not look up that city. Try again.");
  const data = await res.json();
  if (!data.results?.length) {
    throw new Error("No city matched that name. Check spelling or try another name.");
  }
  return data.results[0];
}

async function fetchCurrent(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
    wind_speed_unit: "kmh",
    temperature_unit: "celsius",
  });
  const res = await fetch(`${WEATHER_URL}?${params}`);
  if (!res.ok) throw new Error("Weather data is unavailable right now.");
  const data = await res.json();
  if (!data.current) throw new Error("Weather data is unavailable right now.");
  return data.current;
}

function formatLocation(place) {
  const parts = [place.admin1, place.country].filter(Boolean);
  return parts.join(", ");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();
  const query = cityInput.value;
  if (!query.trim()) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Loading…";

  try {
    const place = await geocodeCity(query);
    const current = await fetchCurrent(place.latitude, place.longitude);

    placeName.textContent = place.name;
    placeDetail.textContent = formatLocation(place) || "—";

    const t = current.temperature_2m;
    const feels = current.apparent_temperature;
    tempEl.textContent = typeof t === "number" ? Math.round(t) : "—";
    unitEl.textContent = "°C";
    conditionEl.textContent = weatherLabel(current.weather_code);

    feelsEl.textContent =
      typeof feels === "number" ? `${Math.round(feels)}°C` : "—";
    const hum = current.relative_humidity_2m;
    humidityEl.textContent = typeof hum === "number" ? `${hum}%` : "—";
    const w = current.wind_speed_10m;
    windEl.textContent = typeof w === "number" ? `${Math.round(w)} km/h` : "—";

    resultEl.hidden = false;
  } catch (err) {
    showError(err instanceof Error ? err.message : "Something went wrong.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Search";
  }
});
