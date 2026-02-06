import { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface WeatherData {
  current: {
    temp: number;
    humidity: number;
    windSpeed: number;
    condition: string;
    icon: LucideIcon;
    isDay: boolean;
    precip: number;
  };
  daily: Array<{
    day: string;
    maxTemp: number;
    minTemp: number;
    condition: string;
    icon: LucideIcon;
  }>;
  location: string;
}

// Map WMO Weather Codes to readable format
const getWeatherInfo = (code: number) => {
  if (code === 0) return { condition: 'Clear Sky', icon: Sun };
  if (code >= 1 && code <= 3) return { condition: 'Partly Cloudy', icon: Cloud };
  if (code >= 45 && code <= 48) return { condition: 'Foggy', icon: CloudFog };
  if (code >= 51 && code <= 67) return { condition: 'Rain', icon: CloudRain };
  if (code >= 71 && code <= 77) return { condition: 'Snow', icon: CloudSnow };
  if (code >= 80 && code <= 82) return { condition: 'Showers', icon: CloudRain };
  if (code >= 95 && code <= 99) return { condition: 'Thunderstorm', icon: CloudLightning };
  return { condition: 'Unknown', icon: Sun };
};

export const useWeather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Fetch Weather Data
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
          );
          
          if (!response.ok) throw new Error('Failed to fetch weather data');
          
          const data = await response.json();
          
          // Get Location Name (Reverse Geocoding) - Optional, using coords for now or generic
          // Ideally we would use a reverse geocoding API here, but for now we'll display coordinates or "Local Weather"
          // Let's try to fetch a simple reverse geocoding if possible, otherwise generic.
          // We can use https://api.bigdatacloud.net/data/reverse-geocode-client (free, no key)
          let locationName = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
          try {
             const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
             const geoData = await geoRes.json();
             locationName = `${geoData.city || geoData.locality || 'Unknown Location'}, ${geoData.countryCode}`;
          } catch (e) {
             console.error("Reverse geocode failed", e);
          }

          // Process Current Weather
          const currentInfo = getWeatherInfo(data.current.weather_code);
          
          // Process Daily Forecast
          const daily = data.daily.time.map((time: string, index: number) => {
            const code = data.daily.weather_code[index];
            const info = getWeatherInfo(code);
            const date = new Date(time);
            // Format day name (e.g., "Mon", "Tue")
            const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
            
            return {
              day: dayName,
              maxTemp: Math.round(data.daily.temperature_2m_max[index]),
              minTemp: Math.round(data.daily.temperature_2m_min[index]),
              condition: info.condition,
              icon: info.icon
            };
          }).slice(0, 5); // Take first 5 days

          setWeather({
            current: {
              temp: Math.round(data.current.temperature_2m),
              humidity: data.current.relative_humidity_2m,
              windSpeed: data.current.wind_speed_10m,
              condition: currentInfo.condition,
              icon: currentInfo.icon,
              isDay: data.current.is_day === 1,
              precip: data.current.precipitation
            },
            daily,
            location: locationName
          });
        } catch (err) {
          setError('Failed to fetch weather data');
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('Unable to retrieve your location');
        setLoading(false);
        console.error(err);
      }
    );
  }, []);

  return { weather, loading, error };
};
