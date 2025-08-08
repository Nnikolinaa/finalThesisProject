// src/routes/weather-routes.ts (Primer)
import { Router, type Request,type  Response } from 'express';
import axios from 'axios';

const router = Router();
interface WeatherQueryParams {
    lat?: string;
    lon?: string;
}

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Ruta za trenutnu vremensku prognozu (po koordinatama)
router.get('/weather/current', async (req: Request, res: Response): Promise<void> => {
    const { lat, lon } = req.query as WeatherQueryParams;

    if (!lat || !lon) {
        res.status(400).json({ message: 'Latitude and longitude are required.' });
        return;
    }
    try {
        const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
            params: {
                lat,
                lon,
                appid: OPENWEATHER_API_KEY,
                units: 'metric' 
            }
        });
        const weatherData = {
            temperature: response.data.main.temp,
            feelsLike: response.data.main.feels_like,
            minTemp: response.data.main.temp_min,
            maxTemp: response.data.main.temp_max,
            humidity: response.data.main.humidity,
            pressure: response.data.main.pressure,
            description: response.data.weather[0].description,
            icon: response.data.weather[0].icon,
            main: response.data.weather[0].main,
            windSpeed: response.data.wind.speed,
            cityName: response.data.name,
            country: response.data.sys.country
        };
        res.json(weatherData);
    } catch (error: any) {
        console.error('Error fetching current weather:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            message: 'Failed to fetch current weather data.',
            details: error.response?.data || error.message
        });
    }
});

// Ruta za 5-dnevnu/3-časovnu prognozu (po koordinatama)
router.get('/weather/forecast', async (req: Request, res: Response): Promise<void> => {
    const { lat, lon } = req.query as WeatherQueryParams;

    if (!lat || !lon) {
        res.status(400).json({ message: 'Latitude and longitude are required.' });
        return;
    }

    try {
        const response = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
            params: {
                lat,
                lon,
                appid: OPENWEATHER_API_KEY,
                units: 'metric'
            }
        });

        // Možete filtrirati i formatirati listu prognoza kako vam odgovara
        const forecastData = response.data.list.map((item: any) => ({
            dt: item.dt, // Unix timestamp
            temperature: item.main.temp,
            feelsLike: item.main.feels_like,
            description: item.weather[0].description,
            icon: item.weather[0].icon,
            main: item.weather[0].main,
            windSpeed: item.wind.speed,
            dtTxt: item.dt_txt // Date in YYYY-MM-DD HH:MM:SS format
        }));

        res.json({
            city: response.data.city.name,
            country: response.data.city.country,
            list: forecastData
        });

    } catch (error: any) {
        console.error('Error fetching weather forecast:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            message: 'Failed to fetch weather forecast data.',
            details: error.response?.data || error.message
        });
    }
});

export default router;