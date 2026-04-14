import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiPlanSession } from './ai-plan-session.entity';
import { CreateCopilotPlanDto } from './dto/create-copilot-plan.dto';
import { ObservationPoint } from '../observation/observation.entity';
import { AppException, ErrorCode } from '@/common/exceptions';
import { AppLogger } from '@/common/logging/app-logger.service';

type Target = {
  name: string;
  reason: string;
  settings: string;
  score: number;
};

type RecommendedPoint = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  lightPollution: number;
  elevation?: number | null;
  distanceKm?: number;
  reason: string;
};

type TimelineItem = {
  step: string;
  minutes: number;
};

type CopilotPlanOutput = {
  title: string;
  summary: string;
  recommendedPoints: RecommendedPoint[];
  targets: Target[];
  checklist: string[];
  timeline: TimelineItem[];
  risks: string[];
  provider: 'openai' | 'openrouter' | 'fallback';
  model: string;
};

type ProviderConfig = {
  provider: 'openai' | 'openrouter';
  apiKey: string;
  baseUrl: string;
  model: string;
};

type StreamWriter = {
  write: (event: string, data: unknown) => void;
};

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(AiPlanSession)
    private readonly planRepo: Repository<AiPlanSession>,
    @InjectRepository(ObservationPoint)
    private readonly observationRepo: Repository<ObservationPoint>,
    private readonly logger: AppLogger,
  ) {}

  private scoreTargets(preference: string, level: string): Target[] {
    const presets: Record<string, Target[]> = {
      moon: [
        {
          name: '月面高对比区',
          reason: '目标明亮，受城市光害影响小，适合快速出片。',
          settings: 'ISO 100-200，快门 1/200-1/500，连拍并堆栈。',
          score: 92,
        },
        {
          name: '月海与环形山边界',
          reason: '细节层次丰富，适合检验跟踪和锐化流程。',
          settings: '短曝光多帧，后期局部锐化，避免过曝。',
          score: 88,
        },
      ],
      planet: [
        {
          name: '木星',
          reason: '亮度高且细节明显，行星入门收益高。',
          settings: '视频模式 60fps+，ROI 裁切，后期叠加。',
          score: 90,
        },
        {
          name: '土星',
          reason: '环结构辨识度高，内容传播效果好。',
          settings: '视频短片多段采集，挑选稳定气流时段。',
          score: 85,
        },
      ],
      'deep-sky': [
        {
          name: 'M42 猎户座大星云',
          reason: '亮目标，深空入门容错较高。',
          settings: 'ISO 800-1600，单张 30-90s，多张堆栈。',
          score: 90,
        },
        {
          name: '仙女座星系 M31',
          reason: '构图空间大，易形成完整作品。',
          settings: '广角或中焦，分段曝光避免核心过曝。',
          score: 84,
        },
      ],
      'wide-field': [
        {
          name: '银河核心区域',
          reason: '成片氛围强，适合社区展示与互动。',
          settings: '广角大光圈，20-30s，ISO 1600-3200。',
          score: 91,
        },
        {
          name: '星轨',
          reason: '流程简单稳定，适合快速完成一次完整拍摄。',
          settings: '固定机位连拍 200 张+，后期叠加。',
          score: 86,
        },
      ],
      mixed: [
        {
          name: '月面 + 广域地景',
          reason: '同一晚可完成两种题材，产出更丰富。',
          settings: '先拍月面再拍地景，分段参数管理。',
          score: 89,
        },
        {
          name: '木星 + 星野',
          reason: '兼顾细节与氛围，适合社区展示。',
          settings: '行星用视频，星野用长曝光照片。',
          score: 83,
        },
      ],
    };

    const list = presets[preference] ?? presets.mixed;
    if (level === 'beginner') {
      return list.map((item) => ({ ...item, score: item.score + 2 }));
    }
    if (level === 'advanced') {
      return list.map((item) => ({ ...item, score: item.score - 2 }));
    }
    return list;
  }

  private haversine(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earth = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earth * c;
  }

  private async recommendPoints(
    dto: CreateCopilotPlanDto,
  ): Promise<RecommendedPoint[]> {
    const points = await this.observationRepo.find({
      order: { createdAt: 'DESC' },
      take: 50,
    });

    if (!dto.latitude || !dto.longitude) {
      return points.slice(0, 3).map((point) => ({
        id: point.id,
        name: point.name,
        latitude: Number(point.latitude),
        longitude: Number(point.longitude),
        lightPollution: Number(point.lightPollution ?? 5),
        elevation: point.elevation ?? null,
        reason: '社区高频使用观测点，适合作为优先候选。',
      }));
    }

    return points
      .map((point) => {
        const distance = this.haversine(
          dto.latitude!,
          dto.longitude!,
          Number(point.latitude),
          Number(point.longitude),
        );

        return {
          id: point.id,
          name: point.name,
          latitude: Number(point.latitude),
          longitude: Number(point.longitude),
          lightPollution: Number(point.lightPollution ?? 5),
          elevation: point.elevation ?? null,
          distanceKm: distance,
          reason: `距离约 ${distance.toFixed(1)} km，便于夜间往返。`,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3);
  }

  private getProviderConfig(): ProviderConfig | null {
    const preferredProvider =
      process.env.AI_PROVIDER?.trim().toLowerCase() || 'openai';

    if (preferredProvider === 'openrouter') {
      const apiKey = process.env.OPENROUTER_API_KEY?.trim();

      if (!apiKey) {
        return null;
      }

      return {
        provider: 'openrouter',
        apiKey,
        baseUrl: (
          process.env.OPENROUTER_BASE_URL?.trim() ||
          'https://openrouter.ai/api/v1'
        ).replace(/\/$/, ''),
        model:
          process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-oss-20b:free',
      };
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      return null;
    }

    return {
      provider: 'openai',
      apiKey,
      baseUrl: (
        process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1'
      ).replace(/\/$/, ''),
      model: process.env.OPENAI_MODEL?.trim() || 'gpt-5.2',
    };
  }

  private buildPrompt(
    dto: CreateCopilotPlanDto,
    points: RecommendedPoint[],
    targets: Target[],
    duration: number,
  ) {
    return {
      userInput: {
        locationName: dto.locationName,
        latitude: dto.latitude,
        longitude: dto.longitude,
        deviceType: dto.deviceType,
        deviceModel: dto.deviceModel,
        startTime: dto.startTime,
        endTime: dto.endTime,
        preference: dto.preference ?? 'mixed',
        level: dto.level ?? 'intermediate',
        availableMinutes: duration,
      },
      candidateObservationPoints: points,
      candidateTargets: targets,
      outputRequirements: {
        language: 'zh-CN',
        constraints: [
          '只返回 JSON，不要返回 markdown',
          'recommendedPoints 只能从提供的 candidateObservationPoints 里挑选，且必须保留原始 id',
          'targets 最多 4 个，score 范围 1-100',
          'timeline.minutes 必须是正整数',
          'checklist 和 risks 都要可执行、具体',
        ],
      },
    };
  }

  private buildJsonSchema() {
    return {
      type: 'object',
      additionalProperties: false,
      required: [
        'title',
        'summary',
        'recommendedPoints',
        'targets',
        'checklist',
        'timeline',
        'risks',
      ],
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' },
        recommendedPoints: {
          type: 'array',
          maxItems: 3,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'reason'],
            properties: {
              id: { type: 'string' },
              reason: { type: 'string' },
            },
          },
        },
        targets: {
          type: 'array',
          maxItems: 4,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'reason', 'settings', 'score'],
            properties: {
              name: { type: 'string' },
              reason: { type: 'string' },
              settings: { type: 'string' },
              score: { type: 'number' },
            },
          },
        },
        checklist: {
          type: 'array',
          items: { type: 'string' },
        },
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['step', 'minutes'],
            properties: {
              step: { type: 'string' },
              minutes: { type: 'number' },
            },
          },
        },
        risks: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    };
  }

  private buildFallbackPlan(
    dto: CreateCopilotPlanDto,
    points: RecommendedPoint[],
    targets: Target[],
    duration: number,
  ): CopilotPlanOutput {
    const preference = dto.preference ?? 'mixed';

    return {
      title: `${dto.locationName} 今晚观测计划`,
      summary: `基于 ${dto.deviceType}${dto.deviceModel ? ` · ${dto.deviceModel}` : ''} 生成的 ${duration} 分钟计划，优先 ${preference} 方向目标。`,
      recommendedPoints: points,
      targets,
      checklist: [
        '出发前检查电量、存储卡、露水防护',
        '到达后先完成对焦与水平校准',
        '优先执行评分最高目标，留 20% 时间做补拍',
        '拍摄结束后记录环境参数并回传社区复盘',
      ],
      timeline: [
        { step: '准备与架设', minutes: Math.round(duration * 0.2) },
        { step: '主目标拍摄', minutes: Math.round(duration * 0.55) },
        { step: '补拍与备份', minutes: Math.round(duration * 0.25) },
      ],
      risks: [
        '若云量突增，优先保留亮目标（如月面/木星）',
        '若跟踪不稳，缩短单张曝光并提高堆栈张数',
      ],
      provider: 'fallback',
      model: 'rules-v1',
    };
  }

  private sanitizeTargets(targets: Target[]): Target[] {
    return targets
      .filter((item) => item?.name && item?.reason && item?.settings)
      .slice(0, 4)
      .map((item, index) => ({
        name: String(item.name).trim(),
        reason: String(item.reason).trim(),
        settings: String(item.settings).trim(),
        score: Number.isFinite(item.score)
          ? Math.max(1, Math.min(100, Math.round(item.score)))
          : 85 - index * 5,
      }));
  }

  private normalizeListItem(value: unknown): string {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value).trim();
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const candidates = [
        record.text,
        record.message,
        record.content,
        record.reason,
        record.label,
        record.title,
      ];

      for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
          return candidate.trim();
        }
      }
    }

    return '';
  }

  private sanitizeStringList(values: unknown, fallback: string[]): string[] {
    if (!Array.isArray(values)) {
      return fallback;
    }

    const list = values
      .map((value) => this.normalizeListItem(value))
      .filter(Boolean)
      .slice(0, 8);

    return list.length > 0 ? list : fallback;
  }

  private sanitizeTimeline(
    values: unknown,
    duration: number,
    fallback: TimelineItem[],
  ): TimelineItem[] {
    if (!Array.isArray(values)) {
      return fallback;
    }

    const list = values
      .map((value) => {
        const item = value as Partial<TimelineItem>;
        const minutes = Number(item?.minutes);
        return {
          step: String(item?.step ?? '').trim(),
          minutes: Number.isFinite(minutes)
            ? Math.max(5, Math.min(duration, Math.round(minutes)))
            : 0,
        };
      })
      .filter((item) => item.step && item.minutes > 0)
      .slice(0, 6);

    return list.length > 0 ? list : fallback;
  }

  private sanitizePoints(
    values: unknown,
    sourcePoints: RecommendedPoint[],
  ): RecommendedPoint[] {
    if (!Array.isArray(values) || values.length === 0) {
      return sourcePoints;
    }

    const byId = new Map(sourcePoints.map((point) => [point.id, point]));

    const list = values
      .map((value) => {
        const item = value as Partial<RecommendedPoint>;
        const matched = item?.id ? byId.get(String(item.id)) : undefined;

        if (!matched) {
          return null;
        }

        return {
          ...matched,
          reason:
            String(item.reason ?? matched.reason).trim() || matched.reason,
        };
      })
      .filter((item): item is RecommendedPoint => Boolean(item))
      .slice(0, 3);

    return list.length > 0 ? list : sourcePoints;
  }

  private extractJsonText(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const response = payload as {
      output_text?: string;
      output?: Array<{
        type?: string;
        content?: Array<{ type?: string; text?: string }>;
      }>;
    };

    if (
      typeof response.output_text === 'string' &&
      response.output_text.trim()
    ) {
      return response.output_text.trim();
    }

    const texts =
      response.output
        ?.flatMap((item) => item.content ?? [])
        .filter((item) => item.type === 'output_text' && item.text)
        .map((item) => item.text!.trim()) ?? [];

    return texts.length > 0 ? texts.join('\n').trim() : null;
  }

  private extractChatCompletionText(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const response = payload as {
      choices?: Array<{
        message?: {
          content?: string | Array<{ type?: string; text?: string }>;
        };
      }>;
    };

    const content = response.choices?.[0]?.message?.content;

    if (typeof content === 'string' && content.trim()) {
      return content.trim();
    }

    if (Array.isArray(content)) {
      const texts = content
        .map((item) => item?.text?.trim())
        .filter((item): item is string => Boolean(item));

      return texts.length > 0 ? texts.join('\n').trim() : null;
    }

    return null;
  }

  private async parseSseStream(
    response: globalThis.Response,
    onMessage: (event: string, data: string) => void,
  ) {
    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error('stream body is empty');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      while (true) {
        const separatorMatch = buffer.match(/\r?\n\r?\n/);
        if (!separatorMatch || separatorMatch.index === undefined) {
          break;
        }

        const separatorIndex = separatorMatch.index;
        const separatorLength = separatorMatch[0].length;
        const rawEvent = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + separatorLength);

        if (!rawEvent.trim()) {
          continue;
        }

        let event = 'message';
        const dataLines: string[] = [];

        for (const line of rawEvent.split(/\r?\n/)) {
          if (line.startsWith('event:')) {
            event = line.slice(6).trim() || 'message';
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trimStart());
          }
        }

        if (dataLines.length > 0) {
          onMessage(event, dataLines.join('\n'));
        }
      }
    }
  }

  private serializePlanPreview(output: CopilotPlanOutput) {
    const lines = [
      `计划标题：${output.title}`,
      '',
      `概览：${output.summary}`,
      '',
      '推荐观测点：',
      ...output.recommendedPoints.map(
        (point, index) =>
          `${index + 1}. ${point.name}（光害 ${point.lightPollution}）- ${point.reason}`,
      ),
      '',
      '推荐目标：',
      ...output.targets.map(
        (target, index) =>
          `${index + 1}. ${target.name}：${target.reason}；参数建议：${target.settings}`,
      ),
      '',
      '执行清单：',
      ...output.checklist.map((item, index) => `${index + 1}. ${item}`),
      '',
      '风险提示：',
      ...output.risks.map((item, index) => `${index + 1}. ${item}`),
    ];

    return lines.join('\n');
  }

  private async streamFallbackPreview(
    writer: StreamWriter,
    output: CopilotPlanOutput,
  ) {
    const text = this.serializePlanPreview(output);
    const chunkSize = 24;

    for (let index = 0; index < text.length; index += chunkSize) {
      writer.write('delta', {
        text: text.slice(index, index + chunkSize),
      });
      await new Promise((resolve) => setTimeout(resolve, 16));
    }
  }

  private async requestOpenAIPlan(
    provider: ProviderConfig,
    prompt: unknown,
    signal: AbortSignal,
  ) {
    const response = await fetch(`${provider.baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: '你是一个专业的天文观测副驾。你需要根据用户输入、候选观测点和候选目标，输出一份可执行、具体、面向真实夜间观测的计划。输出必须为严格 JSON。',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify(prompt),
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'astronomy_copilot_plan',
            strict: true,
            schema: this.buildJsonSchema(),
          },
        },
      }),
      signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      this.logger.warn('ai.provider.request_failed', {
        provider: 'openai',
        stream: false,
        statusCode: response.status,
        detail: detail.slice(0, 300),
      });
      return null;
    }

    const payload = (await response.json()) as unknown;
    return this.extractJsonText(payload);
  }

  private async requestOpenAIPlanStream(
    provider: ProviderConfig,
    prompt: unknown,
    signal: AbortSignal,
    onDelta: (text: string) => void,
  ) {
    const response = await fetch(`${provider.baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        stream: true,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: '你是一个专业的天文观测副驾。你需要根据用户输入、候选观测点和候选目标，输出一份可执行、具体、面向真实夜间观测的计划。输出必须为严格 JSON。',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify(prompt),
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'astronomy_copilot_plan',
            strict: true,
            schema: this.buildJsonSchema(),
          },
        },
      }),
      signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      this.logger.warn(
        `OpenAI stream request failed: ${response.status} ${detail.slice(0, 300)}`,
      );
      throw new Error(
        `OpenAI stream failed: ${response.status} ${detail.slice(0, 200)}`,
      );
    }

    let output = '';

    await this.parseSseStream(response, (event, data) => {
      if (data === '[DONE]') {
        return;
      }

      let payload: {
        type?: string;
        delta?: string;
        error?: { message?: string };
      };

      try {
        payload = JSON.parse(data) as {
          type?: string;
          delta?: string;
          error?: { message?: string };
        };
      } catch (error) {
        this.logger.warn('ai.provider.sse_parse_skipped', {
          provider: 'openai',
          event,
          message: error instanceof Error ? error.message : 'unknown error',
        });
        return;
      }

      if (payload.type === 'error') {
        throw new Error(payload.error?.message ?? 'openai stream failed');
      }

      if (payload.type === 'response.output_text.delta' && payload.delta) {
        output += payload.delta;
        onDelta(payload.delta);
      }
    });

    return output.trim() || null;
  }

  private async requestOpenRouterPlan(
    provider: ProviderConfig,
    prompt: unknown,
    signal: AbortSignal,
  ) {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        response_format: {
          type: 'json_object',
        },
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的天文观测副驾。请根据用户输入、候选观测点和候选目标，输出一份可执行、具体、面向真实夜间观测的计划。只返回合法 JSON，不要 markdown，不要解释。',
          },
          {
            role: 'user',
            content: JSON.stringify(prompt),
          },
        ],
      }),
      signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      this.logger.warn('ai.provider.request_failed', {
        provider: 'openrouter',
        stream: false,
        statusCode: response.status,
        detail: detail.slice(0, 300),
      });
      return null;
    }

    const payload = (await response.json()) as unknown;
    return this.extractChatCompletionText(payload);
  }

  private async requestOpenRouterPlanStream(
    provider: ProviderConfig,
    prompt: unknown,
    signal: AbortSignal,
    onDelta: (text: string) => void,
  ) {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        stream: true,
        response_format: {
          type: 'json_object',
        },
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的天文观测副驾。请根据用户输入、候选观测点和候选目标，输出一份可执行、具体、面向真实夜间观测的计划。只返回合法 JSON，不要 markdown，不要解释。',
          },
          {
            role: 'user',
            content: JSON.stringify(prompt),
          },
        ],
      }),
      signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      this.logger.warn(
        `OpenRouter stream request failed: ${response.status} ${detail.slice(0, 300)}`,
      );
      throw new Error(
        `OpenRouter stream failed: ${response.status} ${detail.slice(0, 200)}`,
      );
    }

    let output = '';

    await this.parseSseStream(response, (_event, data) => {
      if (data === '[DONE]') {
        return;
      }

      let payload: {
        error?: { message?: string };
        choices?: Array<{
          delta?: {
            content?: string;
          };
        }>;
      };

      try {
        payload = JSON.parse(data) as {
          error?: { message?: string };
          choices?: Array<{
            delta?: {
              content?: string;
            };
          }>;
        };
      } catch (error) {
        this.logger.warn('ai.provider.sse_parse_skipped', {
          provider: 'openrouter',
          message: error instanceof Error ? error.message : 'unknown error',
        });
        return;
      }

      if (payload.error?.message) {
        throw new Error(payload.error.message);
      }

      const delta = payload.choices?.[0]?.delta?.content;
      if (delta) {
        output += delta;
        onDelta(delta);
      }
    });

    return output.trim() || null;
  }

  private async generatePlanWithModel(
    dto: CreateCopilotPlanDto,
    points: RecommendedPoint[],
    targets: Target[],
    duration: number,
  ): Promise<CopilotPlanOutput | null> {
    const provider = this.getProviderConfig();

    if (!provider) {
      return null;
    }

    const prompt = this.buildPrompt(dto, points, targets, duration);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const jsonText =
        provider.provider === 'openrouter'
          ? await this.requestOpenRouterPlan(
              provider,
              prompt,
              controller.signal,
            )
          : await this.requestOpenAIPlan(provider, prompt, controller.signal);

      if (!jsonText) {
        this.logger.warn('ai.provider.response_missing_json', {
          provider: provider.provider,
          model: provider.model,
        });
        return null;
      }

      const parsed = JSON.parse(jsonText) as Partial<CopilotPlanOutput>;
      const fallback = this.buildFallbackPlan(dto, points, targets, duration);
      const sanitizedTargets = this.sanitizeTargets(parsed.targets ?? targets);

      return {
        title: String(parsed.title ?? fallback.title).trim() || fallback.title,
        summary:
          String(parsed.summary ?? fallback.summary).trim() || fallback.summary,
        recommendedPoints: this.sanitizePoints(
          parsed.recommendedPoints,
          points,
        ),
        targets:
          sanitizedTargets.length > 0 ? sanitizedTargets : fallback.targets,
        checklist: this.sanitizeStringList(
          parsed.checklist,
          fallback.checklist,
        ),
        timeline: this.sanitizeTimeline(
          parsed.timeline,
          duration,
          fallback.timeline,
        ),
        risks: this.sanitizeStringList(parsed.risks, fallback.risks),
        provider: provider.provider,
        model: provider.model,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown provider error';
      this.logger.warn('ai.provider.generation_failed', {
        provider: provider.provider,
        model: provider.model,
        fallbackEnabled: true,
        message,
      });
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  async createPlan(userId: string, dto: CreateCopilotPlanDto) {
    const level = dto.level ?? 'intermediate';
    const preference = dto.preference ?? 'mixed';
    const targets = this.scoreTargets(preference, level);
    const points = await this.recommendPoints(dto);
    const duration =
      dto.availableMinutes ??
      Math.max(
        60,
        Math.round(
          (new Date(dto.endTime).getTime() -
            new Date(dto.startTime).getTime()) /
            60000,
        ),
      );
    const output =
      (await this.generatePlanWithModel(dto, points, targets, duration)) ??
      this.buildFallbackPlan(dto, points, targets, duration);

    const session = this.planRepo.create({
      userId,
      inputJson: dto,
      outputJson: output,
    });
    const saved = await this.planRepo.save(session);

    return {
      id: saved.id,
      ...output,
      createdAt: saved.createdAt,
    };
  }

  async streamPlan(
    userId: string,
    dto: CreateCopilotPlanDto,
    writer: StreamWriter,
  ) {
    const level = dto.level ?? 'intermediate';
    const preference = dto.preference ?? 'mixed';
    const targets = this.scoreTargets(preference, level);
    const points = await this.recommendPoints(dto);
    const duration =
      dto.availableMinutes ??
      Math.max(
        60,
        Math.round(
          (new Date(dto.endTime).getTime() -
            new Date(dto.startTime).getTime()) /
            60000,
        ),
      );

    writer.write('status', { stage: 'started' });

    const provider = this.getProviderConfig();
    const fallback = this.buildFallbackPlan(dto, points, targets, duration);
    let output: CopilotPlanOutput | null = null;
    let streamedDeltaCount = 0;

    if (provider) {
      const prompt = this.buildPrompt(dto, points, targets, duration);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      try {
        writer.write('status', {
          stage: 'streaming',
          provider: provider.provider,
          model: provider.model,
        });

        const jsonText =
          provider.provider === 'openrouter'
            ? await this.requestOpenRouterPlanStream(
                provider,
                prompt,
                controller.signal,
                (text) => {
                  streamedDeltaCount += text.length;
                  writer.write('delta', { text });
                },
              )
            : await this.requestOpenAIPlanStream(
                provider,
                prompt,
                controller.signal,
                (text) => {
                  streamedDeltaCount += text.length;
                  writer.write('delta', { text });
                },
              );

        if (jsonText) {
          const parsed = JSON.parse(jsonText) as Partial<CopilotPlanOutput>;
          const sanitizedTargets = this.sanitizeTargets(
            parsed.targets ?? targets,
          );
          output = {
            title:
              String(parsed.title ?? fallback.title).trim() || fallback.title,
            summary:
              String(parsed.summary ?? fallback.summary).trim() ||
              fallback.summary,
            recommendedPoints: this.sanitizePoints(
              parsed.recommendedPoints,
              points,
            ),
            targets:
              sanitizedTargets.length > 0 ? sanitizedTargets : fallback.targets,
            checklist: this.sanitizeStringList(
              parsed.checklist,
              fallback.checklist,
            ),
            timeline: this.sanitizeTimeline(
              parsed.timeline,
              duration,
              fallback.timeline,
            ),
            risks: this.sanitizeStringList(parsed.risks, fallback.risks),
            provider: provider.provider,
            model: provider.model,
          };
        }
      } catch (error) {
        writer.write('status', {
          stage: 'fallback',
          reason:
            error instanceof Error ? error.message : 'model stream failed',
        });
      } finally {
        clearTimeout(timeout);
      }
    }

    if (!output) {
      output = fallback;
      await this.streamFallbackPreview(writer, output);
    } else if (streamedDeltaCount === 0) {
      await this.streamFallbackPreview(writer, output);
    }

    writer.write('status', { stage: 'saving' });

    const session = this.planRepo.create({
      userId,
      inputJson: dto,
      outputJson: output,
    });
    const saved = await this.planRepo.save(session);

    writer.write('result', {
      id: saved.id,
      ...output,
      createdAt: saved.createdAt,
    });
    writer.write('done', { ok: true });
  }

  async history(userId: string, page = 1, pageSize = 10) {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0
        ? Math.min(50, Math.floor(pageSize))
        : 10;

    const [sessions, total] = await this.planRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    });

    return {
      items: sessions.map((session) => ({
        id: session.id,
        createdAt: session.createdAt,
        input: session.inputJson,
        output: session.outputJson,
      })),
      page: safePage,
      pageSize: safePageSize,
      total,
      hasMore: safePage * safePageSize < total,
    };
  }

  async removeHistory(userId: string, id: string) {
    const result = await this.planRepo.delete({ id, userId });

    if (!result.affected) {
      throw AppException.notFound(ErrorCode.AI_PLAN_NOT_FOUND);
    }

    return { id };
  }
}
