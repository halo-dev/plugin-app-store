export const prependDomain = (url?: string) => {
  const { VITE_APP_STORE_BACKEND } = import.meta.env;
  if (url?.startsWith("http") || url?.startsWith("data")) {
    return url;
  }
  if (url?.startsWith("/")) {
    return `${VITE_APP_STORE_BACKEND}${url}`;
  }
  return `${VITE_APP_STORE_BACKEND}/${url}`;
};
