const apiKey = "96ec09645a4f54b322679c33403b4620";

async function getWeather() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) return;

  // Reset UI
  document.getElementById("temperature").textContent = "--°";
  document.getElementById("conditions").textContent = "Loading...";
  document.getElementById("weatherIcon").style.opacity = "0";
  document.getElementById("sunrise").textContent = "--:--";
  document.getElementById("sunset").textContent = "--:--";
  document.getElementById("aqiCircle").textContent = "--";
  document.getElementById("aqiText").textContent = "--";
  document.getElementById("aqiCircle").className = "aqi-circle";

  try {
    // Weather
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
    );
    if (!weatherResponse.ok) throw new Error("City not found");
    const weatherData = await weatherResponse.json();

    // Air quality
    const aqiResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${weatherData.coord.lat}&lon=${weatherData.coord.lon}&appid=${apiKey}`
    );
    const aqiData = await aqiResponse.json();

    updateWeatherDisplay(weatherData);
    updateAirQuality(aqiData);
    updateBackground((weatherData.weather?.[0]?.main || "").toLowerCase());
  } catch (err) {
    document.getElementById("conditions").textContent = err.message || "Error";
  }
}

// ---- helpers ----
function formatLocalClockFromUTC(utcSeconds, offsetSeconds) {
  // shift the UTC epoch by the city’s offset, then format as UTC (no second shift)
  const ms = (utcSeconds + offsetSeconds) * 1000;
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC"
  }).format(ms);
}

// ---- UI updaters ----
function updateWeatherDisplay(data) {
  document.getElementById("location").textContent = data.name;
  document.getElementById("temperature").textContent = `${Math.round(data.main.temp)}°`;
  document.getElementById("conditions").textContent = data.weather[0].description;

  const icon = document.getElementById("weatherIcon");
  icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  icon.style.opacity = "1";

  const tz = Number(data.timezone) || 0; // seconds offset from UTC for that city (includes DST)

  // Correct local times
  document.getElementById("sunrise").textContent = formatLocalClockFromUTC(data.sys.sunrise, tz);
  document.getElementById("sunset").textContent  = formatLocalClockFromUTC(data.sys.sunset,  tz);
}

function updateAirQuality(data) {
  const aqi = data?.list?.[0]?.main?.aqi || 0; // 1..5 per OWM
  const labels = ["Unknown","Excellent","Good","Moderate","Unhealthy","Very Unhealthy"];
  const classes = ["","aqi-good","aqi-good","aqi-moderate","aqi-unhealthy","aqi-unhealthy"];

  const aqiCircle = document.getElementById("aqiCircle");
  aqiCircle.textContent = aqi || "--";
  aqiCircle.className = "aqi-circle " + (classes[aqi] || "");
  document.getElementById("aqiText").textContent = labels[aqi] || "Unknown";
}

function updateBackground(condition) {
  const videoMap = {
    clear: "./backgrounds/clear.mp4",
    clouds: "./backgrounds/clouds.mp4",
    rain: "./backgrounds/rain.mp4",
    drizzle: "./backgrounds/rain.mp4",
    snow: "./backgrounds/snow.mp4",
    thunder: "./backgrounds/thunder.mp4",
    thunderstorm: "./backgrounds/thunder.mp4"
  };
  const videoSrc = videoMap[condition] || videoMap.clear;
  const video = document.getElementById("bgVideo");

  if (!video.querySelector(`source[src="${videoSrc}"]`)) {
    video.innerHTML = `<source src="${videoSrc}" type="video/mp4">`;
    video.load();
    video.play().catch(() => {});
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const weatherGlass = document.querySelector(".weather-glass");
  weatherGlass.style.background = document.body.classList.contains("dark-mode")
    ? "rgba(0, 0, 0, 0.15)"
    : "rgba(255, 255, 255, 0.15)";
}

// Enter key
document.getElementById("cityInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") getWeather();
});
