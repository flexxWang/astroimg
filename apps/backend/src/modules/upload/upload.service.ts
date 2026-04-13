import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { randomUUID } from 'crypto';
import path from 'path';
import { AppException, ErrorCode } from '@/common/exceptions';

@Injectable()
export class UploadService {
  private readonly client: Client;
  private readonly bucket: string;
  private readonly publicBase: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT') || '';
    const port = Number(this.configService.get<string>('MINIO_PORT') || 9000);
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY') || '';
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY') || '';
    const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
    this.bucket = this.configService.get<string>('MINIO_BUCKET') || 'astroimg';
    const publicUrl = this.configService.get<string>('MINIO_PUBLIC_URL') || '';

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

  private async ensureBucket() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, 'us-east-1');
    }
  }

  async signUpload(userId: string, filename: string) {
    try {
      await this.ensureBucket();
      const ext = path.extname(filename).toLowerCase();
      const base = path.basename(filename, ext);
      const safeName = base.replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';
      const objectKey = `works/${userId}/${randomUUID()}-${safeName}${ext}`;
      const uploadUrl = await this.client.presignedPutObject(
        this.bucket,
        objectKey,
        10 * 60,
      );
      const fileUrl = `${this.publicBase}/${this.bucket}/${objectKey}`;
      return { uploadUrl, fileUrl, objectKey };
    } catch (error) {
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
