/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
    "/v1/forecast": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 7 day weather forecast for coordinates
         * @description 7 day weather variables in hourly and daily resolution for given WGS84 latitude and longitude coordinates. Available worldwide.
         */
        get: {
            parameters: {
                query: {
                    hourly?: ("temperature_2m" | "relative_humidity_2m" | "dew_point_2m" | "apparent_temperature" | "pressure_msl" | "cloud_cover" | "cloud_cover_low" | "cloud_cover_mid" | "cloud_cover_high" | "wind_speed_10m" | "wind_speed_80m" | "wind_speed_120m" | "wind_speed_180m" | "wind_direction_10m" | "wind_direction_80m" | "wind_direction_120m" | "wind_direction_180m" | "wind_gusts_10m" | "shortwave_radiation" | "direct_radiation" | "direct_normal_irradiance" | "diffuse_radiation" | "vapour_pressure_deficit" | "evapotranspiration" | "precipitation" | "weather_code" | "snow_height" | "freezing_level_height" | "soil_temperature_0cm" | "soil_temperature_6cm" | "soil_temperature_18cm" | "soil_temperature_54cm" | "soil_moisture_0_1cm" | "soil_moisture_1_3cm" | "soil_moisture_3_9cm" | "soil_moisture_9_27cm" | "soil_moisture_27_81cm")[];
                    daily?: ("temperature_2m_max" | "temperature_2m_min" | "apparent_temperature_max" | "apparent_temperature_min" | "precipitation_sum" | "precipitation_hours" | "weather_code" | "sunrise" | "sunset" | "wind_speed_10m_max" | "wind_gusts_10m_max" | "wind_direction_10m_dominant" | "shortwave_radiation_sum" | "uv_index_max" | "uv_index_clear_sky_max" | "et0_fao_evapotranspiration")[];
                    /** @description WGS84 coordinate */
                    latitude: number;
                    /** @description WGS84 coordinate */
                    longitude: number;
                    current_weather?: boolean;
                    temperature_unit?: "celsius" | "fahrenheit";
                    wind_speed_unit?: "kmh" | "ms" | "mph" | "kn";
                    /** @description If format `unixtime` is selected, all time values are returned in UNIX epoch time in seconds. Please not that all time is then in GMT+0! For daily values with unix timestamp, please apply `utc_offset_seconds` again to get the correct date. */
                    timeformat?: "iso8601" | "unixtime";
                    /** @description If `timezone` is set, all timestamps are returned as local-time and data is returned starting at 0:00 local-time. Any time zone name from the [time zone database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) is supported. */
                    timezone?: string;
                    /** @description If `past_days` is set, yesterdays or the day before yesterdays data are also returned. */
                    past_days?: 1 | 2;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /**
                             * @description WGS84 of the center of the weather grid-cell which was used to generate this forecast. This coordinate might be up to 5 km away.
                             * @example 52.52
                             */
                            latitude?: number;
                            /**
                             * @description WGS84 of the center of the weather grid-cell which was used to generate this forecast. This coordinate might be up to 5 km away.
                             * @example 13.419.52
                             */
                            longitude?: number;
                            /**
                             * @description The elevation in meters of the selected weather grid-cell. In mountain terrain it might differ from the location you would expect.
                             * @example 44.812
                             */
                            elevation?: number;
                            /**
                             * @description Generation time of the weather forecast in milli seconds. This is mainly used for performance monitoring and improvements.
                             * @example 2.2119
                             */
                            generationtime_ms?: number;
                            /**
                             * @description Applied timezone offset from the &timezone= parameter.
                             * @example 3600
                             */
                            utc_offset_seconds?: number;
                            /** @description For each selected weather variable, data will be returned as a floating point array. Additionally a `time` array will be returned with ISO8601 timestamps. */
                            hourly?: Record<string, never>;
                            /** @description For each selected weather variable, the unit will be listed here. */
                            hourly_units?: {
                                [key: string]: string;
                            };
                            /** @description For each selected daily weather variable, data will be returned as a floating point array. Additionally a `time` array will be returned with ISO8601 timestamps. */
                            daily?: Record<string, never>;
                            /** @description For each selected daily weather variable, the unit will be listed here. */
                            daily_units?: {
                                [key: string]: string;
                            };
                            /** @description Current weather conditions with the attributes: time, temperature, wind_speed, wind_direction and weather_code */
                            current_weather?: Record<string, never>;
                        };
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @description Always set true for errors */
                            error?: boolean;
                            /**
                             * @description Description of the error
                             * @example Latitude must be in range of -90 to 90°. Given: 300
                             */
                            reason?: string;
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        HourlyResponse: {
            time: string[];
            temperature_2m?: Record<string, never>[];
            relative_humidity_2m?: Record<string, never>[];
            dew_point_2m?: Record<string, never>[];
            apparent_temperature?: Record<string, never>[];
            pressure_msl?: Record<string, never>[];
            cloud_cover?: Record<string, never>[];
            cloud_cover_low?: Record<string, never>[];
            cloud_cover_mid?: Record<string, never>[];
            cloud_cover_high?: Record<string, never>[];
            wind_speed_10m?: Record<string, never>[];
            wind_speed_80m?: Record<string, never>[];
            wind_speed_120m?: Record<string, never>[];
            wind_speed_180m?: Record<string, never>[];
            wind_direction_10m?: Record<string, never>[];
            wind_direction_80m?: Record<string, never>[];
            wind_direction_120m?: Record<string, never>[];
            wind_direction_180m?: Record<string, never>[];
            wind_gusts_10m?: Record<string, never>[];
            shortwave_radiation?: Record<string, never>[];
            direct_radiation?: Record<string, never>[];
            direct_normal_irradiance?: Record<string, never>[];
            diffuse_radiation?: Record<string, never>[];
            vapour_pressure_deficit?: Record<string, never>[];
            evapotranspiration?: Record<string, never>[];
            precipitation?: Record<string, never>[];
            weather_code?: Record<string, never>[];
            snow_height?: Record<string, never>[];
            freezing_level_height?: Record<string, never>[];
            soil_temperature_0cm?: Record<string, never>[];
            soil_temperature_6cm?: Record<string, never>[];
            soil_temperature_18cm?: Record<string, never>[];
            soil_temperature_54cm?: Record<string, never>[];
            soil_moisture_0_1cm?: Record<string, never>[];
            soil_moisture_1_3cm?: Record<string, never>[];
            soil_moisture_3_9cm?: Record<string, never>[];
            soil_moisture_9_27cm?: Record<string, never>[];
            soil_moisture_27_81cm?: Record<string, never>[];
        };
        DailyResponse: {
            time: string[];
            temperature_2m_max?: Record<string, never>[];
            temperature_2m_min?: Record<string, never>[];
            apparent_temperature_max?: Record<string, never>[];
            apparent_temperature_min?: Record<string, never>[];
            precipitation_sum?: Record<string, never>[];
            precipitation_hours?: Record<string, never>[];
            weather_code?: Record<string, never>[];
            sunrise?: Record<string, never>[];
            sunset?: Record<string, never>[];
            wind_speed_10m_max?: Record<string, never>[];
            wind_gusts_10m_max?: Record<string, never>[];
            wind_direction_10m_dominant?: Record<string, never>[];
            shortwave_radiation_sum?: Record<string, never>[];
            uv_index_max?: Record<string, never>[];
            uv_index_clear_sky_max?: Record<string, never>[];
            et0_fao_evapotranspiration?: Record<string, never>[];
        };
        CurrentWeather: {
            time: string;
            temperature: Record<string, never>;
            wind_speed: Record<string, never>;
            wind_direction: Record<string, never>;
            weather_code: Record<string, never>;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
