import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

class R2Service {
  constructor() {
    const strip = (value) =>
      String(value || "")
        .trim()
        .replace(/^"|"$/g, "")
        .replace(/^'|'$/g, "");

    const rawEndpoint = strip(process.env.R2_ENDPOINT || "");
    this.accessKeyId = strip(process.env.R2_ACCESS_KEY || "");
    this.secretAccessKey = strip(process.env.R2_SECRET_KEY || "");
    this.bucket = strip(process.env.R2_BUCKET || "");

    let endpoint = rawEndpoint;
    try {
      if (rawEndpoint) {
        const url = new URL(rawEndpoint);
        const pathBucket = url.pathname.replace(/^\/+|\/+$/g, "");
        if (!this.bucket && pathBucket) {
          this.bucket = pathBucket;
          url.pathname = "/";
          endpoint = url.toString().replace(/\/$/, "");
        } else if (this.bucket && pathBucket) {
          if (pathBucket !== this.bucket) {
            this.bucket = pathBucket;
          }
          url.pathname = "/";
          endpoint = url.toString().replace(/\/$/, "");
        }
      }
    } catch (error) {
      endpoint = rawEndpoint;
    }

    this.endpoint = endpoint;
    this.publicBaseUrl = process.env.R2_PUBLIC_URL || rawEndpoint;

    this.enabled = Boolean(
      this.endpoint && this.accessKeyId && this.secretAccessKey && this.bucket,
    );

    if (this.enabled) {
      this.client = new S3Client({
        region: "auto",
        endpoint: this.endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });
    } else {
      this.client = null;
    }
  }

  isEnabled() {
    return this.enabled;
  }

  getPublicUrlForKey(key) {
    const base = (this.publicBaseUrl || "").replace(/\/+$/, "");
    return `${base}/${encodeURI(key)}`;
  }

  sanitizePathSegment(value) {
    return String(value || "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\\/]+/g, "-")
      .replace(/\s+/g, " ")
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .trim();
  }

  async uploadVideoBuffer({
    buffer,
    contentType,
    formationTitle,
    filename = "video.mp4",
    contentLength,
  }) {
    if (!this.enabled) {
      throw new Error("R2 is not configured");
    }

    const safeFormationTitle = this.sanitizePathSegment(formationTitle);
    const key = `formations/${safeFormationTitle}/lessons/${safeFormationTitle}/${filename}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentLength: contentLength,
      ContentType: contentType || "video/mp4",
      CacheControl: "public, max-age=31536000",
    });

    await this.client.send(command);

    return {
      key,
      url: this.getPublicUrlForKey(key),
    };
  }
}

export const r2Service = new R2Service();
