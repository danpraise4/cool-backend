export interface AzureBlobStorageConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset?: string;
  allowedFileTypes?: string[];
  maxSizeBytes?: number;
}

export interface BlobResponse {
  success: boolean;
  url?: string;
  blobName?: string;
  error?: string;
}
