export interface PluginInstallationErrorResponse {
  detail: string;
  instance: string;
  pluginName: string;
  requestId: string;
  status: number;
  timestamp: string;
  title: string;
  type: string;
}

export interface ThemeInstallationErrorResponse {
  detail: string;
  instance: string;
  themeName: string;
  requestId: string;
  status: number;
  timestamp: string;
  title: string;
  type: string;
}
