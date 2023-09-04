import type { Content, Metadata } from "@halo-dev/api-client";

export interface Application {
  apiVersion: string;
  kind: string;
  metadata: Metadata;
  spec: ApplicationSpec;
  status?: ApplicationStatus;
}

export interface ApplicationDetail {
  application: Application;
  latestRelease?: ReleaseDetail;
  owner: Owner;
  readme?: ApplicationContent;
  downloadable?: boolean;
  bought?: boolean;
  availableForPurchase?: boolean;
  downloads?: number;
  commentCount?: number;
  views?: number;
}

export interface ApplicationSpec {
  categoryName?: string;
  priceConfig?: PriceConfig;
  readmeName?: string;
  description?: string;
  displayName: string;
  licenses?: ApplicationLicense[];
  links?: ApplicationLink[];
  logo?: string;
  openSource?: ApplicationOpenSource;
  ownerName?: string;
  publish?: boolean;
  screenshots?: ApplicationScreenshot[];
  tags?: string[];
  type: "PLUGIN" | "THEME";
  vendor?: ApplicationVendor;
}

export interface PriceConfig {
  mode: "FREE" | "ONE_TIME";
  oneTimePrice: number;
}

export interface ApplicationLicense {
  name: string;
  spdxId: string;
  url: string;
}

export interface ApplicationLink {
  name: string;
  url: string;
}

export interface ApplicationOpenSource {
  closed: boolean;
  repo: string;
}

export interface ApplicationScreenshot {
  description?: string;
  url: string;
}

export interface ApplicationVendor {
  displayName: string;
  logo?: string;
  website?: string;
}

export interface ApplicationStatus {
  downloadCount?: number;
  publishTimestamp?: string;
  published?: boolean;
  rating?: number;
  updateTimestamp?: string;
}

export interface ApplicationRequest {
  application: Application;
  readme: ApplicationContent;
}

export interface ApplicationReleaseRequest {
  release: ApplicationRelease;
  notes: ApplicationContent;
  makeLatest?: boolean;
}

export interface ApplicationContent {
  apiVersion: string;
  html?: string;
  kind: string;
  metadata: Metadata;
  rawType?: "HTML" | "MARKDOWN" | "TEXT";
  raw?: string;
}

export interface ListResponse<T> {
  page: number;
  size: number;
  total: number;
  items: T[];
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  totalPages: number;
}

export interface ApplicationTag {
  apiVersion: string;
  kind: string;
  metadata: Metadata;
  spec: ApplicationTagSpec;
}

export interface ApplicationTagSpec {
  displayName: string;
  privileged: boolean;
  searchable: boolean;
}

export interface ApplicationCategory {
  apiVersion: string;
  kind: string;
  metadata: Metadata;
  spec: ApplicationCategorySpec;
}

export interface ApplicationCategorySpec {
  displayName: string;
  privileged: boolean;
  searchable: boolean;
}

export interface ApplicationRelease {
  apiVersion: string;
  kind: string;
  metadata: Metadata;
  spec: ApplicationReleaseSpec;
  status?: ApplicationReleaseStatus;
}

export interface ApplicationReleaseSpec {
  applicationName?: string;
  displayName: string;
  draft?: boolean;
  ownerName?: string;
  preRelease?: boolean;
  requires?: string;
  version?: string;
  notesName?: string;
}

export interface ApplicationReleaseStatus {
  publishTimestamp: string;
}

export interface ApplicationReleaseAsset {
  apiVersion: string;
  kind: string;
  metadata: Metadata;
  spec: ApplicationReleaseAssetSpec;
  status: ApplicationReleaseAssetStatus;
}

export interface ApplicationReleaseAssetSpec {
  attachmentName: string;
  name: string;
  releaseName: string;
  size: number;
  state: string;
  uploaderName: string;
}

export interface ApplicationReleaseAssetStatus {
  downloadCount: number;
  updateTimestamp: string;
}

export interface Owner {
  avatar?: string;
  bio?: string;
  displayName?: string;
  name: string;
}

export interface ApplicationSearchResult {
  application: Application;
  latestRelease?: ApplicationRelease;
  owner?: Owner;
}

export interface ReleaseDetail {
  release: ApplicationRelease;
  owner?: Owner;
  notes?: ApplicationContent;
  latest?: boolean;
  assets?: ApplicationReleaseAsset[];
}

export interface Order {
  apiVersion: string;
  kind: string;
  metadata: Metadata;
  spec: OrderSpec;
  status?: OrderStatus;
}

export interface OrderSpec {
  applicationName: string;
  ownerName: string;
  totalAmount?: number;
  requestCancel?: boolean;
  expiredAt?: string;
}

export interface OrderStatus {
  state: "PENDING" | "PAID" | "CANCELLED";
  tradeVendor?: "WXPAY" | "ALIPAY";
}

export interface OrderDetail {
  order: Order;
  application: Application;
  owner: Owner;
}
