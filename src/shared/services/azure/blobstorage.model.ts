export interface AzureBlobStorageConfig {
  connectionString: string;
  containerName: string;
  allowedFileTypes?: string[];
  maxSizeBytes?: number;
}

export interface BlobResponse {
  success: boolean;
  url?: string;
  blobName?: string;
  error?: string;
}
