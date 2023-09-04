import axios from "axios";

const storeApiClient = axios.create({
  baseURL: import.meta.env.VITE_APP_STORE_BACKEND,
});

export default storeApiClient;
