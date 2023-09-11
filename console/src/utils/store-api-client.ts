import axios from "axios";
import qs from "qs";

const storeApiClient = axios.create({
  baseURL: import.meta.env.VITE_APP_STORE_BACKEND,
  paramsSerializer: (params) => {
    return qs.stringify(params, { arrayFormat: "repeat" });
  },
});

export default storeApiClient;
