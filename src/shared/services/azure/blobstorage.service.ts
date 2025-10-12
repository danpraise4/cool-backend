import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlobSASPermissions,
  BlockBlobUploadResponse,
} from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import * as path from "path";
import { AzureBlobStorageConfig, BlobResponse } from "./blobstorage.model";
import { Readable } from "stream";
import { Buffer } from "buffer";
  export class AzureBlobService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private config: AzureBlobStorageConfig;
  public static instance: AzureBlobService;
  


  /**
   * Creates an instance of AzureBlobService
   * @param config - Configuration for Azure Blob Storage
   */
  constructor(config: AzureBlobStorageConfig) {
    this.config = config;

    this.blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(config.containerName);
    this.initialize().catch((err) => {
      console.error("Failed to initialize container on startup:", err);
      throw err;
    });
  }

  public static getInstance(connectionString: string, containerName: string): AzureBlobService {
    if (!AzureBlobService.instance) {
      AzureBlobService.instance = new AzureBlobService({ connectionString, containerName });
    }
    return AzureBlobService.instance;
  }

  /**
   * Initialize the blob service by creating the container if it doesn't exist
   */
  public async initialize(): Promise<void> {
    try {
      // Changed to "blob" for public read access to individual blobs
      await this.containerClient.createIfNotExists({ access: "blob" });
      console.log(`Container '${this.config.containerName}' initialized successfully`);
    } catch (error: any) {
      console.error(`Failed to initialize container '${this.config.containerName}': ${error.message}`);
      throw error;
    }
  }

  /**
   * Validates a file based on type and size
   * @param fileType - MIME type of the file
   * @param fileSize - Size of the file in bytes
   * @returns A boolean indicating if the file is valid
   */
  private validateFile(fileType: string, fileSize: number): { valid: boolean; error?: string } {
    if (this.config.allowedFileTypes && !this.config.allowedFileTypes.includes(fileType)) {
      return { valid: false, error: `Invalid file type. Allowed types: ${this.config.allowedFileTypes.join(", ")}` };
    }
    if (this.config.maxSizeBytes && fileSize > this.config.maxSizeBytes) {
      return { valid: false, error: `File size exceeds ${this.config.maxSizeBytes / (1024 * 1024)} MB` };
    }
    return { valid: true };
  }

  /**
   * Extracts blob name from Azure Blob Storage URL
   * @param imageUrl - Full Azure blob URL
   * @returns Blob name without container path
   */
  private extractBlobNameFromUrl(imageUrl: string): string {
    try {
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      // Remove the first empty element and container name
      pathParts.shift(); // Remove empty string from leading '/'
      pathParts.shift(); // Remove container name
      const extractedName = pathParts.join('/'); // Join remaining parts (handles nested folders)
      console.log(`Extracted blob name: "${extractedName}" from URL: ${imageUrl}`);
      return extractedName;
    } catch (error) {
      console.error(`Error extracting blob name from URL: ${imageUrl}`, error);
      // Fallback: assume the URL is already a blob name
      return imageUrl;
    }
  }

  /**
   * Debug method: Lists all blobs in a container or folder to help identify naming issues
   * @param prefix - Optional prefix to filter blobs (e.g., 'images/')
   * @returns Promise resolving to detailed blob information
   */
  public async debugListBlobs(prefix?: string): Promise<void> {
    try {
      console.log(`\n=== DEBUG: Listing blobs with prefix: "${prefix || 'none'}" ===`);
      const blobs = await this.listFiles(prefix);
      console.log(`Found ${blobs.length} blobs:`);
      
      blobs.forEach((blob, index) => {
        console.log(`${index + 1}. Name: "${blob.name}"`);
        console.log(`   URL: ${blob.url}`);
        console.log(`   Content Type: ${blob.contentType}`);
        console.log(`   Size: ${blob.size} bytes`);
        console.log(`   ---`);
      });
      console.log(`=== END DEBUG LIST ===\n`);
    } catch (error: any) {
      console.error(`Error in debugListBlobs: ${error.message}`);
    }
  }

  /**
   * Debug method: Check if a specific blob exists and return its properties
   * @param blobName - Name of the blob to check
   * @returns Promise resolving to blob existence and properties
   */
  public async debugCheckBlob(blobName: string): Promise<{
    exists: boolean;
    properties?: any;
    url?: string;
    error?: string;
  }> {
    try {
      console.log(`\n=== DEBUG: Checking blob: "${blobName}" ===`);
      const blobClient = this.getBlobClient(blobName);
      const exists = await blobClient.exists();
      
      console.log(`Blob exists: ${exists}`);
      console.log(`Blob URL: ${blobClient.url}`);
      
      if (exists) {
        const properties = await blobClient.getProperties();
        console.log(`Content Type: ${properties.contentType}`);
        console.log(`Content Length: ${properties.contentLength}`);
        console.log(`Last Modified: ${properties.lastModified}`);
        console.log(`=== END DEBUG CHECK ===\n`);
        return { exists: true, properties, url: blobClient.url };
      } else {
        console.log(`=== END DEBUG CHECK ===\n`);
        return { exists: false };
      }
    } catch (error: any) {
      console.error(`Error in debugCheckBlob: ${error.message}`);
      return { exists: false, error: error.message };
    }
  }

  public async deleteImage(imageUrl: string): Promise<void> {
    const blobName = this.extractBlobNameFromUrl(imageUrl);
    console.log(`Attempting to delete blob: "${blobName}"`);
    
    // Debug: Check if blob exists first
    const debugResult = await this.debugCheckBlob(blobName);
    if (!debugResult.exists) {
      console.error(`Blob "${blobName}" does not exist. Cannot delete.`);
      throw new Error(`Blob "${blobName}" does not exist`);
    }
    
    const blobClient = this.getBlobClient(blobName);
    await blobClient.delete();
    console.log(`Successfully deleted blob: "${blobName}"`);
  }

  /**
   * Generates a unique blob name with the original file extension
   * @param originalFileName - Original file name
   * @returns A unique blob name
   */
  private generateUniqueBlobName(originalFileName: string): string {
    const extension = path.extname(originalFileName) || '.jpg'; // Default to .jpg if no extension
    const timestamp = new Date().getTime();
    const randomId = uuidv4().substring(0, 8);
    return `${timestamp}-${randomId}${extension}`;
  }

  /**
   * Gets a BlockBlobClient for a specific blob
   * @param blobName - Name of the blob
   * @returns BlockBlobClient for the specified blob
   */
  private getBlobClient(blobName: string): BlockBlobClient {
    return this.containerClient.getBlockBlobClient(blobName);
  }

  /**
   * Uploads a file to Azure Blob Storage
   * @param file - File buffer or stream
   * @param fileName - Original file name
   * @param contentType - MIME type of the file
   * @param fileSize - Size of the file in bytes
   * @param folder - Optional folder path within the container
   * @returns Promise resolving to BlobResponse
   */
  public async uploadFile(
    file: Buffer | Readable,
    fileName: string,
    contentType: string,
    fileSize: number,
    folder?: string
  ): Promise<BlobResponse> {
    try {
      const validation = this.validateFile(contentType, fileSize);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Ensure fileName has an extension based on contentType if missing
      let finalFileName = fileName;
      if (!path.extname(fileName)) {
        const extensionMap: { [key: string]: string } = {
          'image/jpeg': '.jpg',
          'image/jpg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
          'image/webp': '.webp',
          'video/mp4': '.mp4',
          'video/avi': '.avi',
          'video/mov': '.mov',
        };
        const extension = extensionMap[contentType] || '.bin';
        finalFileName = `${fileName}${extension}`;
      }

      let uniqueBlobName = this.generateUniqueBlobName(finalFileName);
      if (folder) {
        uniqueBlobName = `${folder}/${uniqueBlobName}`;
      }
      console.log(`Uploading to blob: ${uniqueBlobName}`);

      const blobClient = this.getBlobClient(uniqueBlobName);
      const uploadOptions = { 
        blobHTTPHeaders: { 
          blobContentType: contentType,
          blobCacheControl: 'public, max-age=31536000' // Added cache control
        }
      };

      let response: BlockBlobUploadResponse;
      if (file instanceof Buffer) {
        response = await blobClient.upload(file, file.length, uploadOptions);
      } else {
        response = await blobClient.uploadStream(file, undefined, undefined, uploadOptions);
      }

      if (response.errorCode) {
        return { success: false, error: `Upload failed: ${response.errorCode}` };
      }

      console.log(`Uploaded to: ${blobClient.url}`);
      return { success: true, url: blobClient.url, blobName: uniqueBlobName };
    } catch (error: any) {
      console.error(`Error uploading file ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Uploads an image to Azure Blob Storage
   * @param imageFile - Image file buffer or stream
   * @param fileName - Original file name
   * @param contentType - MIME type of the image
   * @param fileSize - Size of the image in bytes
   * @returns Promise resolving to BlobResponse
   */
  public async uploadImage(
    imageFile: Buffer | Readable,
    fileName: string,
    contentType: string,
    fileSize: number
  ): Promise<BlobResponse> {
    return this.uploadFile(imageFile, fileName, contentType, fileSize, "images");
  }

  /**
   * Uploads a video to Azure Blob Storage
   * @param videoFile - Video file buffer or stream
   * @param fileName - Original file name
   * @param contentType - MIME type of the video
   * @param fileSize - Size of the video in bytes
   * @returns Promise resolving to BlobResponse
   */
  public async uploadVideo(
    videoFile: Buffer | Readable,
    fileName: string,
    contentType: string,
    fileSize: number
  ): Promise<BlobResponse> {
    return this.uploadFile(videoFile, fileName, contentType, fileSize, "videos");
  }

  /**
   * Deletes a blob from Azure Blob Storage
   * @param blobName - Name of the blob to delete
   * @returns Promise resolving to BlobResponse
   */
  public async deleteFile(blobName: string): Promise<BlobResponse> {
    try {
      const blobClient = this.getBlobClient(blobName);
      const exists = await blobClient.exists();
      console.log(`Blob '${blobName}' exists: ${exists}`);
      if (!exists) {
        return { success: false, error: `Blob '${blobName}' does not exist` };
      }

      await blobClient.delete();
      console.log(`Deleted blob: ${blobName}`);
      return { success: true };
    } catch (error: any) {
      console.error(`Error deleting blob '${blobName}': ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Replaces an existing blob with a new file
   * @param blobName - Name of the blob to replace
   * @param newFile - New file buffer or stream
   * @param contentType - MIME type of the new file
   * @param fileSize - Size of the new file in bytes
   * @returns Promise resolving to BlobResponse
   */
  public async replaceFile(
    blobName: string,
    newFile: Buffer | Readable,
    contentType: string,
    fileSize: number
  ): Promise<BlobResponse> {
    try {
      const blobClient = this.getBlobClient(blobName);
      const exists = await blobClient.exists();
      console.log(`Blob '${blobName}' exists: ${exists}`);
      if (!exists) {
        return { success: false, error: `Blob '${blobName}' does not exist` };
      }

      const validation = this.validateFile(contentType, fileSize);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const uploadOptions = { 
        blobHTTPHeaders: { 
          blobContentType: contentType,
          blobCacheControl: 'public, max-age=31536000'
        }
      };
      let response: BlockBlobUploadResponse;
      if (newFile instanceof Buffer) {
        response = await blobClient.upload(newFile, newFile.length, uploadOptions);
      } else {
        response = await blobClient.uploadStream(newFile, undefined, undefined, uploadOptions);
      }

      if (response.errorCode) {
        return { success: false, error: `Replace failed: ${response.errorCode}` };
      }

      console.log(`Replaced blob: ${blobName}`);
      return { success: true, url: blobClient.url, blobName };
    } catch (error: any) {
      console.error(`Error replacing blob '${blobName}': ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Copies a blob to a new destination
   * @param sourceBlobName - Name of the source blob
   * @param destinationBlobName - Name of the destination blob
   * @returns Promise resolving to BlobResponse
   */
  public async copyFile(
    sourceBlobName: string,
    destinationBlobName?: string
  ): Promise<BlobResponse> {
    try {
      const sourceBlobClient = this.getBlobClient(sourceBlobName);
      const exists = await sourceBlobClient.exists();
      console.log(`Source blob '${sourceBlobName}' exists: ${exists}`);
      if (!exists) {
        return { success: false, error: `Source blob '${sourceBlobName}' does not exist` };
      }

      const finalDestinationName =
        destinationBlobName || `copy-${this.generateUniqueBlobName(sourceBlobName)}`;
      const destinationBlobClient = this.getBlobClient(finalDestinationName);

      const copyPoller = await destinationBlobClient.beginCopyFromURL(sourceBlobClient.url);
      const copyResult = await copyPoller.pollUntilDone();

      if (copyResult.copyStatus !== "success") {
        return { success: false, error: `Copy failed with status: ${copyResult.copyStatus}` };
      }

      console.log(`Copied '${sourceBlobName}' to '${finalDestinationName}'`);
      return { success: true, url: destinationBlobClient.url, blobName: finalDestinationName };
    } catch (error: any) {
      console.error(`Error copying blob '${sourceBlobName}': ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gets a list of blobs in the container or a specific folder
   * @param prefix - Optional prefix to filter blobs (e.g., 'images/')
   * @returns Promise resolving to an array of blob info objects
   */
  public async listFiles(
    prefix?: string
  ): Promise<{ name: string; url: string; contentType: string; size: number }[]> {
    try {
      const options = prefix ? { prefix } : undefined;
      const blobs = [];
      for await (const blob of this.containerClient.listBlobsFlat(options)) {
        const blobClient = this.getBlobClient(blob.name);
        const properties = await blobClient.getProperties();
        blobs.push({
          name: blob.name,
          url: blobClient.url,
          contentType: properties.contentType || "unknown",
          size: properties.contentLength || 0,
        });
      }
      console.log(`Listed ${blobs.length} blobs with prefix '${prefix || "none"}'`);
      return blobs;
    } catch (error: any) {
      console.error(`Error listing blobs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets the URL for a specific blob
   * @param blobName - Name of the blob
   * @returns Promise resolving to the blob URL or null if it doesn't exist
   */
  public async getBlobUrl(blobName: string): Promise<string | null> {
    try {
      const blobClient = this.getBlobClient(blobName);
      const exists = await blobClient.exists();
      console.log(`Blob '${blobName}' exists: ${exists}`);
      return exists ? blobClient.url : null;
    } catch (error: any) {
      console.error(`Error getting blob URL '${blobName}': ${error.message}`);
      return null;
    }
  }

  /**
   * Generates a Shared Access Signature (SAS) URL for a blob with specified permissions
   * @param blobName - Name of the blob
   * @param expiryMinutes - Number of minutes until the SAS expires
   * @param permissions - Permissions for the SAS (e.g., 'r' for read, 'w' for write)
   * @returns Promise resolving to the SAS URL or null if an error occurs
   */
  public async generateSasUrl(
    blobName: string,
    expiryMinutes: number = 60,
    permissions: BlobSASPermissions = BlobSASPermissions.parse("rw")
  ): Promise<string | null> {
    try {
      const blobClient = this.getBlobClient(blobName);
      const exists = await blobClient.exists();
      console.log(`Blob '${blobName}' exists: ${exists}`);
      if (!exists) {
        console.error(`Blob '${blobName}' does not exist`);
        return null;
      }

      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes);

      const sasToken = await blobClient.generateSasUrl({
        permissions,
        expiresOn: expiryTime,
      });
      console.log(`Generated SAS URL for '${blobName}'`);
      return sasToken;
    } catch (error: any) {
      console.error(`Error generating SAS URL for '${blobName}': ${error.message}`);
      return null;
    }
  }

  /**
   * Gets properties of a specific blob
   * @param blobName - Name of the blob
   * @returns Promise resolving to the blob properties or null if it doesn't exist
   */
  public async getBlobProperties(blobName: string): Promise<any | null> {
    try {
      const blobClient = this.getBlobClient(blobName);
      const exists = await blobClient.exists();
      console.log(`Blob '${blobName}' exists: ${exists}`);
      if (!exists) {
        return null;
      }
      const properties = await blobClient.getProperties();
      console.log(`Retrieved properties for '${blobName}'`);
      return properties;
    } catch (error: any) {
      console.error(`Error getting blob properties '${blobName}': ${error.message}`);
      return null;
    }
  }

  /**
   * Uploads a base64 image to Azure Blob Storage
   * @param base64String - Base64 string of the image
   * @param fileName - Original file name
   * @param contentType - MIME type of the image
   * @returns Promise resolving to BlobResponse
   */
  public async uploadBase64Image(
    base64String: string,
    fileName: string,
    contentType: string
  ): Promise<BlobResponse> {
    try {
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileSize = buffer.length;

      return this.uploadFile(buffer, fileName, contentType, fileSize, "images");
    } catch (error: any) {
      console.error(`Error uploading base64 image: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Converts a base64 string to a Buffer and validates it
   * @param base64String - Base64 string to convert
   * @returns Object containing buffer and metadata
   */
  public async validateAndProcessBase64(base64String: string): Promise<{
    valid: boolean;
    buffer?: Buffer;
    contentType?: string;
    error?: string;
  }> {
    try {
      if (!base64String.match(/^data:image\/[a-zA-Z]+;base64,/)) {
        return { valid: false, error: "Invalid base64 string format. Must start with data:image/*;base64," };
      }

      const contentType = base64String.split(";")[0].split(":")[1];
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const validation = this.validateFile(contentType, buffer.length);
      if (!validation.valid) {
        return { valid: false, error: validation.error };
      }

      return { valid: true, buffer, contentType };
    } catch (error: any) {
      return { valid: false, error: `Error processing base64 string: ${error.message}` };
    }
  }

  /**
   * Replaces an existing blob with a base64 image
   * @param blobName - Name of the blob to replace
   * @param base64String - Base64 string of the new image
   * @returns Promise resolving to BlobResponse
   */
  public async replaceWithBase64Image(
    blobName: string,
    base64String: string
  ): Promise<BlobResponse> {
    const processResult = await this.validateAndProcessBase64(base64String);
    if (!processResult.valid || !processResult.buffer || !processResult.contentType) {
      return { success: false, error: processResult.error };
    }
    return this.replaceFile(blobName, processResult.buffer, processResult.contentType, processResult.buffer.length);
  }
}

export const createBlobService = (config: AzureBlobStorageConfig): AzureBlobService => {
  return new AzureBlobService(config);
};

export type { BlobServiceClient, ContainerClient, BlockBlobClient };