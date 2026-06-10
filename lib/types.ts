// Black Seven TV — Types du domaine Xtream Codes.
// Conformes à l'API player_api.php (champs réellement renvoyés par les panels Xtream).

export interface XtreamCredentials {
  /** Base du serveur, scheme + host + port. Ex: http://exemple.com:8080 */
  server: string;
  username: string;
  password: string;
}

export interface XtreamUserInfo {
  username: string;
  password: string;
  status: string; // "Active", "Expired", "Banned"...
  auth: number; // 1 = ok
  exp_date: string | null; // timestamp unix (secondes) en string
  is_trial: string; // "0" | "1"
  active_cons: string;
  max_connections: string;
  created_at?: string;
  message?: string;
}

export interface XtreamServerInfo {
  url: string;
  port: string;
  https_port?: string;
  server_protocol?: string;
  timezone?: string;
}

export interface XtreamAuthResponse {
  user_info: XtreamUserInfo;
  server_info: XtreamServerInfo;
}

export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface XtreamLiveStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string | null;
  added: string;
  category_id: string;
  custom_sid?: string | null;
  tv_archive: number;
  direct_source?: string;
  tv_archive_duration?: number;
}

export interface XtreamShortEpgEntry {
  id: string;
  epg_id: string;
  title: string; // base64
  lang: string;
  start: string; // "YYYY-MM-DD HH:MM:SS"
  end: string;
  description: string; // base64
  channel_id: string;
  start_timestamp: string;
  stop_timestamp: string;
}
