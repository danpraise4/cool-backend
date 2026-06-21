import axios from "axios";
import config from "../../shared/config/app.config";
import RedisService from "./redis.service";

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GoogleGeocodingResult {
  address_components: GoogleAddressComponent[];
}

interface GooglePlaceResult {
  name: string;
  geometry: { location: { lat: number; lng: number } };
}

export default class LocationService {
  public async getLocation(ip: string) {
    const location = await axios.get(`https://ipapi.co/${ip}/json/`);
    return location.data;
  }

  public async getCititiesfromLatLong(body: { lat: number; long: number }) {
    const cacheKey = `location:${body.lat}:${body.long}`;

    const cachedData = await RedisService.instance.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const geocodeRes = await axios.get<{ results: GoogleGeocodingResult[] }>(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${body.lat},${body.long}&key=${config.GOOGLE.API_KEY}`
    );

    const addressComponents: GoogleAddressComponent[] =
      geocodeRes.data.results[0]?.address_components ?? [];
    const country = addressComponents.find((c: GoogleAddressComponent) =>
      c.types.includes("country")
    );

    if (!country) {
      throw new Error("Could not determine country from coordinates");
    }

    const citiesRes = await axios.get<{ results: GooglePlaceResult[] }>(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=cities+in+${country.long_name}&key=${config.GOOGLE.API_KEY}`
    );

    const result = {
      country: country.long_name,
      cities: citiesRes.data.results.map((city: GooglePlaceResult) => ({
        name: city.name,
        location: city.geometry.location,
      })),
    };

    await RedisService.instance.set(cacheKey, JSON.stringify(result), 24 * 60 * 60);

    return result;
  }
}
