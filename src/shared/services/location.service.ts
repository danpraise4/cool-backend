import axios from "axios";
import config from "../../shared/config/app.config";
import RedisService from "./redis.service";

export default class LocationService {
  public async getLocation(ip: string) {
    const location = await axios.get(`https://ipapi.co/${ip}/json/`);
    return location.data;
  }

  public async getCititiesfromLatLong(body: { lat: number; long: number }) {
    // Create cache key from coordinates
    const cacheKey = `location:${body.lat}:${body.long}`;

    // Try to get data from Redis cache first
    const cachedData = await RedisService.instance.get(cacheKey);
    if (cachedData) {
      console.log("Cache hit");
      return JSON.parse(cachedData);
    }

    // If not in cache, fetch from API
    const locationData = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${body.lat},${body.long}&key=${config.GOOGLE.API_KEY}`
    );

    // Extract country from results
    const addressComponents = locationData.data.results[0].address_components;
    const country = addressComponents.find((component: any) =>
      component.types.includes("country")
    );

    if (!country) {
      throw new Error("Could not determine country from coordinates");
    }

    // Get cities for that country
    const citiesData = await axios.get(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=cities+in+${country.long_name}&key=${config.GOOGLE.API_KEY}`
    );

    const result = {
      country: country.long_name,
      cities: citiesData.data.results.map((city: any) => ({
        name: city.name,
        location: city.geometry.location,
      })),
    };

    // Cache the result in Redis for 24 hours
    await RedisService.instance.set(
      cacheKey,
      JSON.stringify(result),
      24 * 60 * 60
    );

    return result;
  }
}
