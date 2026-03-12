import { apiFetch } from "@/services/api";

export function signUpload(filename: string, contentType?: string) {
  return apiFetch<{
    success: boolean;
    data: { uploadUrl: string; fileUrl: string; objectKey: string };
  }>("/uploads/sign", {
    method: "POST",
    body: JSON.stringify({ filename, contentType }),
  });
}

export async function uploadFile(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "上传失败");
  }
}
