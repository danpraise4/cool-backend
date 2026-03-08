"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const app_config_1 = __importDefault(require("../../shared/config/app.config"));
const redis_service_1 = __importDefault(require("./redis.service"));
class LocationService {
    async getLocation(ip) {
        const location = await axios_1.default.get(`https://ipapi.co/${ip}/json/`);
        return location.data;
    }
    async getCititiesfromLatLong(body) {
        // Create cache key from coordinates
        const cacheKey = `location:${body.lat}:${body.long}`;
        // Try to get data from Redis cache first
        const cachedData = await redis_service_1.default.instance.get(cacheKey);
        if (cachedData) {
            console.log("Cache hit");
            return JSON.parse(cachedData);
        }
        // If not in cache, fetch from API
        const locationData = await axios_1.default.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${body.lat},${body.long}&key=${app_config_1.default.GOOGLE.API_KEY}`);
        // Extract country from results
        const addressComponents = locationData.data.results[0].address_components;
        const country = addressComponents.find((component) => component.types.includes("country"));
        if (!country) {
            throw new Error("Could not determine country from coordinates");
        }
        // Get cities for that country
        const citiesData = await axios_1.default.get(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=cities+in+${country.long_name}&key=${app_config_1.default.GOOGLE.API_KEY}`);
        const result = {
            country: country.long_name,
            cities: citiesData.data.results.map((city) => ({
                name: city.name,
                location: city.geometry.location,
            })),
        };
        // Cache the result in Redis for 24 hours
        await redis_service_1.default.instance.set(cacheKey, JSON.stringify(result), 24 * 60 * 60);
        return result;
    }
}
exports.default = LocationService;
