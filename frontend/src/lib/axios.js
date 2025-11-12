import axios from "axios";

const isDev = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV;
const axiosInstance = axios.create({
	// In dev, use Vite proxy to avoid CORS by keeping same-origin
	baseURL: isDev ? "/api" : "/api",
	withCredentials: true, // send cookies to the server
});

export default axiosInstance;
