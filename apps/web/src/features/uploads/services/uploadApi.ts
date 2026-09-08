import axios from "axios";
import { apiFetch } from "@/lib/apiClient";

interface SignedUpload {
  uploadUrl: string;
  method: "POST";
  formData: Record<string, string>;
  fileUrl: string;
  objectKey: string;
  maxUploadBytes: number;
  expiresInSeconds: number;
}

export function signUpload(
  filename: string,
  contentType: string,
  fileSize: number,
) {
  return apiFetch<SignedUpload>(
    "/uploads/sign",
    {
      method: "POST",
      body: JSON.stringify({ filename, contentType, fileSize }),
    },
  );
}

export async function uploadFile(signedUpload: SignedUpload, file: File) {
  const formData = new FormData();
  Object.entries(signedUpload.formData).forEach(([key, value]) => {
    formData.append(key, value);
  });
  formData.append("file", file);

  const response = await axios.post(signedUpload.uploadUrl, formData, {
    validateStatus: () => true,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      typeof response.data === "string" && response.data
        ? response.data
        : "上传失败",
    );
  }
}
