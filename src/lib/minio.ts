import * as Minio from 'minio';
import sharp from 'sharp';
import * as zlib from 'zlib';

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || '187.77.188.200',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET_NAME = 'saahs';

/**
 * Ensures that the bucket exists and has public read access.
 */
async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
    
    // Set bucket policy for public read access
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    };
    
    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    console.log(`Bucket ${BUCKET_NAME} created and policy set to public read.`);
  }
}

/**
 * Uploads a file (from FormData) to MinIO.
 * Compresses images and converts them to WebP.
 * Compresses non-image files using gzip.
 * Returns the public URL of the uploaded file.
 */
export async function uploadToMinio(file: File, folder = 'uploads'): Promise<string> {
  await ensureBucket();

  let buffer = Buffer.from(await file.arrayBuffer());
  let fileName = file.name;
  let mimeType = file.type;
  let metadata: Record<string, string> = {
    'Content-Type': mimeType,
  };

  const isImage = mimeType.startsWith('image/');

  if (isImage) {
    try {
      // Compress and convert to WebP
      buffer = await sharp(buffer)
        .webp({ quality: 80 })
        .toBuffer();
      
      // Update extension to .webp
      const lastDotIndex = fileName.lastIndexOf('.');
      const baseName = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
      fileName = `${baseName}.webp`;
      mimeType = 'image/webp';
      metadata['Content-Type'] = 'image/webp';
    } catch (err) {
      console.error('Image compression failed, uploading original:', err);
    }
  } else {
    try {
      // Compress non-image files using gzip
      const originalLength = buffer.length;
      const compressed = zlib.gzipSync(buffer);
      
      // Only use compression if it actually made the file smaller
      if (compressed.length < originalLength) {
        buffer = compressed;
        metadata['Content-Encoding'] = 'gzip';
      }
    } catch (err) {
      console.error('File compression failed, uploading original:', err);
    }
  }

  // Clean file name to prevent issues in URL
  const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueName = `${folder}/${Date.now()}-${cleanName}`;

  await minioClient.putObject(
    BUCKET_NAME,
    uniqueName,
    buffer,
    buffer.length,
    metadata
  );

  const endpoint = process.env.MINIO_ENDPOINT || '187.77.188.200';
  const port = process.env.MINIO_PORT || '9000';
  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
  
  // If port is standard 80/443, omit it
  const portSuffix = (port === '80' || port === '443') ? '' : `:${port}`;
  
  return `${protocol}://${endpoint}${portSuffix}/${BUCKET_NAME}/${uniqueName}`;
}
