import { getApiErrorCode } from "@/services/api";

const ERROR_MESSAGE_MAP: Record<string, string> = {
  REQUEST_TIMEOUT: "请求超时了，请稍后再试。",
  INVALID_CREDENTIALS: "用户名或密码不正确，请重试。",
  USERNAME_ALREADY_EXISTS: "这个用户名已经被使用了。",
  EMAIL_ALREADY_EXISTS: "这个邮箱已经注册过了。",
  FOLLOW_SELF_FORBIDDEN: "不能关注自己。",
  AI_PLAN_NOT_FOUND: "这条 AI 观测计划不存在或已被删除。",
  DRAFT_NOT_FOUND: "这条草稿不存在或已被删除。",
  POST_NOT_FOUND: "这篇帖子不存在或已被删除。",
  CONVERSATION_NOT_FOUND: "这个会话不存在或你无权访问。",
  WORK_TYPE_INVALID: "所选作品类型无效，请重新选择。",
  WORK_DEVICE_INVALID: "所选拍摄设备无效，请重新选择。",
  WORK_IMAGE_REQUIRED: "图片作品至少需要上传一张图片。",
  WORK_VIDEO_REQUIRED: "视频作品需要上传一个视频。",
  WORK_IMAGE_VIDEO_CONFLICT: "图片和视频不能混合上传，请检查后再试。",
  VALIDATION_ERROR: "提交的数据格式不正确，请检查后再试。",
  UNAUTHORIZED: "当前登录状态已失效，请重新登录。",
  FORBIDDEN: "你当前无权执行这个操作。",
  NOT_FOUND: "请求的内容不存在。",
  CONFLICT: "当前操作发生冲突，请刷新后重试。",
  BAD_REQUEST: "请求参数有误，请检查后再试。",
  INTERNAL_SERVER_ERROR: "服务器开小差了，请稍后再试。",
};

export function getErrorMessage(error: unknown, fallback = "操作失败，请稍后再试。") {
  const code = getApiErrorCode(error);
  if (code && ERROR_MESSAGE_MAP[code]) {
    return ERROR_MESSAGE_MAP[code];
  }

  const message = error instanceof Error ? error.message : "";
  if (message && message !== "Request failed") {
    return message;
  }

  return fallback;
}

export function getErrorMessageByCode(code?: string, fallback?: string) {
  if (code && ERROR_MESSAGE_MAP[code]) {
    return ERROR_MESSAGE_MAP[code];
  }
  return fallback;
}
