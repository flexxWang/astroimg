import axios from "axios";
import { apiFetch } from "@/lib/apiClient";

export function signUpload(filename: string, contentType?: string) {
  return apiFetch<{ uploadUrl: string; fileUrl: string; objectKey: string }>(
    "/uploads/sign",
    {
      method: "POST",
      body: JSON.stringify({ filename, contentType }),
    },
  );
}

export async function uploadFile(uploadUrl: string, file: File) {
  const response = await axios.put(uploadUrl, file, {
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
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
