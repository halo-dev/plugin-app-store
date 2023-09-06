import { useQuery } from "@tanstack/vue-query";
import axios from "axios";

export function useHaloVersion() {
  const { data: haloVersion } = useQuery<string>({
    queryKey: ["halo-version"],
    queryFn: async () => {
      const { data } = await axios.get("/actuator/info", {
        withCredentials: true,
      });
      return data?.build?.version;
    },
    staleTime: 2000,
  });
  return { haloVersion };
}
