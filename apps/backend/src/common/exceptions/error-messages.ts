import { ErrorCode } from './error-codes';

const ERROR_MESSAGE_MAP: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.BAD_REQUEST]: '请求参数有误，请检查后重试',
  [ErrorCode.UNAUTHORIZED]: '未登录或登录已失效，请重新登录',
  [ErrorCode.FORBIDDEN]: '你没有权限执行这个操作',
  [ErrorCode.NOT_FOUND]: '请求的内容不存在或已被删除',
  [ErrorCode.CONFLICT]: '当前操作发生冲突，请稍后再试',
  [ErrorCode.INTERNAL_SERVER_ERROR]: '服务开小差了，请稍后再试',
  [ErrorCode.VALIDATION_ERROR]: '提交的数据校验未通过，请检查后重试',
  [ErrorCode.USERNAME_ALREADY_EXISTS]: '这个用户名已经被使用了',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: '这个邮箱已经注册过了',
  [ErrorCode.INVALID_CREDENTIALS]: '用户名或密码不正确，请重试',
  [ErrorCode.FOLLOW_SELF_FORBIDDEN]: '不能关注自己',
  [ErrorCode.AI_PLAN_NOT_FOUND]: '计划不存在或已删除',
  [ErrorCode.DRAFT_NOT_FOUND]: '这条草稿不存在或已被删除',
  [ErrorCode.POST_NOT_FOUND]: '这篇帖子不存在或已被删除',
  [ErrorCode.CONVERSATION_NOT_FOUND]: '这个会话不存在或你无权访问',
  [ErrorCode.WORK_TYPE_INVALID]: '无效的作品类型',
  [ErrorCode.WORK_DEVICE_INVALID]: '无效的设备类型',
  [ErrorCode.WORK_IMAGE_REQUIRED]: '作品图片不能为空',
  [ErrorCode.WORK_VIDEO_REQUIRED]: '作品视频不能为空',
  [ErrorCode.WORK_IMAGE_VIDEO_CONFLICT]: '图片和视频不能同时提交',
  [ErrorCode.UPLOAD_SIGN_FAILED]: '文件上传签名失败，请稍后再试',
};

export function getErrorMessageByCode(errorCode: ErrorCode) {
  return ERROR_MESSAGE_MAP[errorCode];
}

export function resolveErrorMessage(
  errorCode: ErrorCode,
  message?: string | string[],
) {
  if (message !== undefined) {
    return message;
  }

  return getErrorMessageByCode(errorCode) ?? '操作失败，请稍后再试';
}
