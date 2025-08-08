<template>
  <div class="weather-widget">
    <h3>Weather Forecast for {{ weatherData.cityName || 'Location' }}</h3>

    <div v-if="loading" class="loading-message">
      <p>Loading weather data...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <p>Error loading weather: {{ error }}</p>
    </div>

    <div v-else-if="weatherData.temperature !== null" class="current-weather">
      <div class="current-weather-summary">
        <img :src="weatherIconUrl(weatherData.icon)" alt="Weather icon" class="weather-icon">
        <p class="temperature">{{ weatherData.temperature?.toFixed(1) }}°C</p>
      </div>
      <p class="description">{{ weatherData.description }}</p>
      <p class="details">Feels like: {{ weatherData.feelsLike?.toFixed(1) }}°C</p>
      <p class="details">Humidity: {{ weatherData.humidity }}% | Wind: {{ weatherData.windSpeed }} m/s</p>
    </div>

    <div v-else class="no-data-message">
      <p>No current weather data available for this location.</p>
    </div>

    <div v-if="props.lat !== undefined && props.lon !== undefined" class="map-section">
      <h4>Car Location</h4>
      <div id="car-location-map" class="map-container"></div>
    </div>

    <div v-if="forecastData && forecastData.length > 0" class="forecast-list">
      <h4>5-Day Forecast:</h4>
      <div v-for="(dayForecasts, date) in groupedForecast" :key="date" class="forecast-day-section">
        <h5 class="forecast-date-header">{{ formatDate(String(date)) }}</h5>
        <div class="forecast-grid">
          <div v-for="item in dayForecasts" :key="item.dt" class="forecast-item">
            <p class="forecast-time">{{ formatTime(item.dtTxt) }}</p>
            <img :src="weatherIconUrl(item.icon)" alt="Weather icon" class="forecast-icon">
            <p class="forecast-temp">{{ item.temperature?.toFixed(0) }}°C</p>
            <p class="forecast-desc">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted, nextTick } from 'vue';
import { MainService } from '@/services/mainService';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

const props = defineProps<{
  lat: number;
  lon: number;
}>();

interface WeatherItem {
  temperature: number | null;
  feelsLike: number | null;
  minTemp?: number | null;
  maxTemp?: number | null;
  humidity?: number | null;
  pressure?: number | null;
  description: string;
  icon: string;
  main: string;
  windSpeed?: number | null;
  cityName?: string;
  country?: string;
}

interface ForecastItem {
  dt: number;
  temperature: number | null;
  feelsLike: number | null;
  description: string;
  icon: string;
  main: string;
  windSpeed: number | null;
  dtTxt: string;
}

const weatherData = ref<WeatherItem>({
  temperature: null,
  feelsLike: null,
  description: 'N/A',
  icon: '',
  main: 'N/A',
});
const forecastData = ref<ForecastItem[] | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

let mapInstance: L.Map | null = null;
let markerInstance: L.Marker | null = null;
const currentLocationName = ref<string | null>(null); 


const initializeMap = async () => { // Made async to await the Nominatim call
  if (props.lat !== undefined && props.lon !== undefined && !mapInstance) {

    await nextTick(); 

    const mapDiv = document.getElementById('car-location-map');
    if (mapDiv) {
      mapInstance = L.map(mapDiv).setView([props.lat, props.lon], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance);

      // Fetch city name for the marker immediately
      currentLocationName.value = await MainService.getCityNameFromCoordinates(props.lat, props.lon);

      markerInstance = L.marker([props.lat, props.lon]).addTo(mapInstance)
        .bindPopup(`<b>Car Location</b><br>${currentLocationName.value}`) // Use the fetched name here
        .openPopup();
    }
  }
};

const updateMapLocation = async () => { // Made async
  if (mapInstance && markerInstance && props.lat !== undefined && props.lon !== undefined) {
    const newLatLng = new L.LatLng(props.lat, props.lon);
    markerInstance.setLatLng(newLatLng);
    mapInstance.setView(newLatLng, 13);

    // Fetch new city name and update popup
    currentLocationName.value = await MainService.getCityNameFromCoordinates(props.lat, props.lon);
    markerInstance.getPopup()?.setContent(`<b>Car Location</b><br>${currentLocationName.value}`);
  } else if (props.lat !== undefined && props.lon !== undefined && !mapInstance) {
    initializeMap(); // Re-initialize if map wasn't there
  }
};


const fetchWeatherData = async (lat: number, lon: number) => {
  loading.value = true;
  error.value = null;
  try {
    const [currentWeatherRes, forecastRes] = await Promise.all([
      MainService.getCurrentWeather(lat, lon),
      MainService.getWeatherForecast(lat, lon)
    ]);

    weatherData.value = {
      temperature: currentWeatherRes.data.temperature,
      feelsLike: currentWeatherRes.data.feelsLike,
      minTemp: currentWeatherRes.data.minTemp,
      maxTemp: currentWeatherRes.data.maxTemp,
      humidity: currentWeatherRes.data.humidity,
      pressure: currentWeatherRes.data.pressure,
      description: currentWeatherRes.data.description,
      icon: currentWeatherRes.data.icon,
      main: currentWeatherRes.data.main,
      windSpeed: currentWeatherRes.data.windSpeed,
      cityName: currentWeatherRes.data.cityName, // This is still good for weather display
      country: currentWeatherRes.data.country,
    };
    forecastData.value = forecastRes.data.list;

  } catch (err: any) {
    console.error('Failed to fetch weather data:', err);
    error.value = err.response?.data?.message || 'Could not retrieve weather data.';
  } finally {
    loading.value = false;
  }
};

const weatherIconUrl = (iconCode: string) => {
  if (!iconCode) return '';
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

const formatTime = (dtTxt: string) => {
  const date = new Date(dtTxt);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

const groupedForecast = computed(() => {
  if (!forecastData.value) return {};
  const groups: { [key: string]: ForecastItem[] } = {};
  forecastData.value.forEach(item => {
    const dateKey = item.dtTxt.split(' ')[0];
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
  });
  return groups;
});


onMounted(() => {
  if (props.lat !== undefined && props.lon !== undefined) {
    fetchWeatherData(props.lat, props.lon);
    initializeMap(); // Initialize map on component mount
  }
});

watch(() => [props.lat, props.lon], ([newLat, newLon]) => {
  if (newLat !== undefined && newLon !== undefined) {
    fetchWeatherData(newLat as number, newLon as number);
    updateMapLocation(); // Update map if location props change
  }
}, { immediate: true });

onUnmounted(() => {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    markerInstance = null;
  }
});
</script>



<style scoped>


/* New style for the daily forecast section */
.forecast-day-section {
  margin-bottom: 25px; 
  border-top: 1px solid #e0f2f7; 
  padding-top: 20px; 
}

/* New style for the daily header */
.forecast-date-header {
  color: #0056b3; 
  margin-bottom: 15px; 
  font-size: 1.3em; 
  font-weight: 700; 
  text-align: left; 
  padding-left: 5px; 
}


.forecast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 15px;
 
}

.forecast-item {
  background-color: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 10px;
  padding: 15px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.forecast-time {
  font-size: 0.9em;
  font-weight: 600;
  color: #007bff;
  margin-bottom: 8px;
}

.forecast-icon {
  width: 50px;
  height: 50px;
  margin-bottom: 5px;
}

.forecast-temp {
  font-size: 1.3em;
  font-weight: 700;
  color: #333;
  margin-bottom: 5px;
}

.forecast-desc {
  font-size: 0.85em;
  color: #666;
  text-transform: capitalize;
}

@media (max-width: 768px) {
  .current-weather-summary {
    flex-direction: column;
    gap: 5px;
  }
  .temperature {
    font-size: 2.8em;
  }
  .description {
    font-size: 1.2em;
  }
  .forecast-grid {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  }
}

.map-section {
  margin-top: 30px;
  margin-bottom: 30px;
  padding: 25px;
  background-color: #f0f8ff;
  border: 1px solid #d0e8f8;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.map-section h4 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.5em;
  font-weight: 500;
}

.map-container {
  height: 350px; 
  width: 100%;
  border-radius: 8px;
  border: 1px solid #bbdefb;
}


@media (max-width: 768px) {
  .map-container {
    height: 300px; 
  }
}
</style>