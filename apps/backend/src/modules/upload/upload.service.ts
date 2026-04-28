import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { randomUUID } from 'crypto';
import path from 'path';
import { AppException, ErrorCode } from '@/common/exceptions';

const CONTENT_TYPE_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/tiff': ['.tif', '.tiff'],
  'application/fits': ['.fits', '.fit', '.fts'],
  'application/x-fits': ['.fits', '.fit', '.fts'],
};

@Injectable()
export class UploadService {
  private readonly client: Client;
  private readonly bucket: string;
  private readonly publicBase: string;
  private readonly allowedContentTypes: Set<string>;
  private readonly maxUploadBytes: number;
  private readonly presignTtlSeconds: number;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT') || '';
    const port = Number(this.configService.get<string>('MINIO_PORT') || 9000);
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY') || '';
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY') || '';
    const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
    this.bucket = this.configService.get<string>('MINIO_BUCKET') || 'astroimg';
    const publicUrl = this.configService.get<string>('MINIO_PUBLIC_URL') || '';
    this.allowedContentTypes = new Set(
      this.configService.get<string[]>('app.upload.allowedContentTypes') ?? [],
    );
    this.maxUploadBytes =
      this.configService.get<number>('app.upload.maxBytes') ?? 50 * 1024 * 1024;
    this.presignTtlSeconds =
      this.configService.get<number>('app.upload.presignTtlSeconds') ?? 600;

    if (!endpoint || !accessKey || !secretKey) {
      throw new Error('MinIO configuration is missing');
    }

    this.client = new Client({
      endPoint: endpoint,
      port,
      accessKey,
      secretKey,
      useSSL,
    });

    if (publicUrl) {
      this.publicBase = publicUrl.replace(/\/$/, '');
    } else {
      this.publicBase = `${useSSL ? 'https' : 'http'}://${endpoint}:${port}`;
    }
  }

  private assertUploadAllowed(
    filename: string,
    contentType: string,
    fileSize: number,
  ) {
    const normalizedContentType = contentType.trim().toLowerCase();
    const ext = path.extname(filename).toLowerCase();
    const allowedExtensions = CONTENT_TYPE_EXTENSIONS[normalizedContentType];

    if (
      !this.allowedContentTypes.has(normalizedContentType) ||
      !allowedExtensions
    ) {
      throw AppException.badRequest(ErrorCode.BAD_REQUEST, '不支持的文件类型');
    }

    if (!allowedExtensions.includes(ext)) {
      throw AppException.badRequest(
        ErrorCode.BAD_REQUEST,
        '文件扩展名和内容类型不匹配',
      );
    }

    if (fileSize > this.maxUploadBytes) {
      throw AppException.badRequest(ErrorCode.BAD_REQUEST, '文件大小超过限制', {
        maxUploadBytes: this.maxUploadBytes,
      });
    }

    return normalizedContentType;
  }

  private async ensureBucket() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, 'us-east-1');
    }
  }

  async signUpload(
    userId: string,
    filename: string,
    contentType: string,
    fileSize: number,
  ) {
    const normalizedContentType = this.assertUploadAllowed(
      filename,
      contentType,
      fileSize,
    );

    try {
      await this.ensureBucket();
      const ext = path.extname(filename).toLowerCase();
      const base = path.basename(filename, ext);
      const safeName = base.replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';
      const objectKey = `works/${userId}/${randomUUID()}-${safeName}${ext}`;
      const postPolicy = this.client.newPostPolicy();
      postPolicy.setBucket(this.bucket);
      postPolicy.setKey(objectKey);
      postPolicy.setContentType(normalizedContentType);
      postPolicy.setContentLengthRange(1, this.maxUploadBytes);
      postPolicy.setExpires(
        new Date(Date.now() + this.presignTtlSeconds * 1000),
      );
      const post = await this.client.presignedPostPolicy(postPolicy);
      const uploadUrl = `${this.publicBase}/${this.bucket}`;
      const fileUrl = `${this.publicBase}/${this.bucket}/${objectKey}`;
      return {
        uploadUrl,
        method: 'POST',
        formData: post.formData as Record<string, string>,
        fileUrl,
        objectKey,
        maxUploadBytes: this.maxUploadBytes,
        expiresInSeconds: this.presignTtlSeconds,
      };
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      throw AppException.internal(ErrorCode.UPLOAD_SIGN_FAILED);
    }
  }

  async checkHealth() {
    const bucketExists = await this.client.bucketExists(this.bucket);
    return {
      bucket: this.bucket,
      bucketExists,
    };
  }
}
