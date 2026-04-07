"use client";

import PretextStreamText from "@/components/PretextStreamText";

type ParsedTarget = {
  name: string;
  reason?: string;
  settings?: string;
};

type ParsedPreview = {
  title?: string;
  summary?: string;
  targets: ParsedTarget[];
  checklist: string[];
  risks: string[];
};

function decodeJsonFragment(value: string) {
  return value
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\");
}

function normalizeTypingText(value: string) {
  return value
    .replace(/\r/g, "")
    .replace(/[ \t\u00A0]{2,}/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimStart();
}

function parseStringField(raw: string, key: string) {
  const match = raw.match(new RegExp(`"${key}"\\s*:\\s*"([^]*)`));
  if (!match) {
    return "";
  }

  const content = match[1];
  const quoteIndex = content.search(/(?<!\\)"/);
  const value = quoteIndex === -1 ? content : content.slice(0, quoteIndex);
  return decodeJsonFragment(value).trim();
}

function parseStringArray(raw: string, key: string) {
  const keyIndex = raw.indexOf(`"${key}"`);
  if (keyIndex === -1) {
    return [];
  }

  const start = raw.indexOf("[", keyIndex);
  if (start === -1) {
    return [];
  }

  const block = raw.slice(start + 1);
  const matches = [...block.matchAll(/"((?:\\.|[^"])*)"/g)];
  return matches.map((match) => decodeJsonFragment(match[1]).trim()).filter(Boolean);
}

function parseTargets(raw: string): ParsedTarget[] {
  const keyIndex = raw.indexOf('"targets"');
  if (keyIndex === -1) {
    return [];
  }

  const start = raw.indexOf("[", keyIndex);
  if (start === -1) {
    return [];
  }

  const targetBlock = raw.slice(start + 1);
  const objectMatches = [...targetBlock.matchAll(/\{([^]*?)\}/g)];

  return objectMatches
    .map((match) => {
      const objectText = match[1];
      const name = parseStringField(`{${objectText}}`, "name");
      const reason = parseStringField(`{${objectText}}`, "reason");
      const settings = parseStringField(`{${objectText}}`, "settings");
      return { name, reason, settings };
    })
    .filter((item) => item.name)
    .slice(0, 4);
}

function parseStreamPreview(raw: string): ParsedPreview {
  return {
    title: parseStringField(raw, "title"),
    summary: parseStringField(raw, "summary"),
    targets: parseTargets(raw),
    checklist: parseStringArray(raw, "checklist").slice(0, 6),
    risks: parseStringArray(raw, "risks").slice(0, 6),
  };
}

export default function StreamPlanSections({
  rawText,
  isStreaming = false,
}: {
  rawText: string;
  isStreaming?: boolean;
}) {
  const preview = parseStreamPreview(rawText);
  const normalizedRawText = normalizeTypingText(rawText);
  const hasRawTyping = normalizedRawText.trim().length > 0;
  const showRawTyping = isStreaming;
  const showTargetsSkeleton = preview.targets.length === 0;
  const showChecklistSkeleton = preview.checklist.length === 0;
  const showRisksSkeleton = preview.risks.length === 0;

  return (
    <div className="space-y-4">
      {showRawTyping ? (
        <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-sky-700">
            正在生成
          </div>
          <PretextStreamText
            text={normalizedRawText || "AI 正在连接模型并生成观测计划..."}
            className="min-h-[120px]"
            minHeight={120}
          />
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            推荐目标
          </div>
          <div className="space-y-3">
            {!showTargetsSkeleton ? (
              preview.targets.map((target, index) => (
                <div
                  key={`${target.name}-${index}`}
                  className="stream-target-card rounded-lg border bg-slate-50/70 p-3"
                  style={{ animationDelay: `${index * 110}ms` }}
                >
                  <div className="text-sm font-medium text-slate-900">{target.name}</div>
                  {target.reason ? (
                    <div className="mt-1 text-xs leading-5 text-slate-600">{target.reason}</div>
                  ) : null}
                  {target.settings ? (
                    <div className="mt-2 text-[11px] leading-5 text-slate-500">
                      {target.settings}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`target-skeleton-${index}`}
                    className="rounded-lg border border-slate-200/80 bg-slate-50/80 p-3"
                  >
                    <div className="stream-skeleton h-4 w-1/2 rounded-full" />
                    <div className="mt-3 stream-skeleton h-3 w-full rounded-full" />
                    <div className="mt-2 stream-skeleton h-3 w-5/6 rounded-full" />
                    <div className="mt-3 stream-skeleton h-3 w-2/3 rounded-full" />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              执行清单
            </div>
            {!showChecklistSkeleton ? (
              <ul className="space-y-2 text-sm text-slate-700">
                {preview.checklist.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-2">
                    <span className="mt-0.5 text-xs text-slate-400">{index + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`checklist-skeleton-${index}`} className="flex gap-2">
                    <div className="stream-skeleton mt-1 h-3 w-3 rounded-full" />
                    <div className="stream-skeleton h-4 flex-1 rounded-full" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              风险提示
            </div>
            {!showRisksSkeleton ? (
              <ul className="space-y-2 text-sm text-slate-700">
                {preview.risks.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-2">
                    <span className="mt-0.5 text-xs text-amber-500">{index + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={`risk-skeleton-${index}`} className="flex gap-2">
                    <div className="stream-skeleton mt-1 h-3 w-3 rounded-full" />
                    <div className="stream-skeleton h-4 flex-1 rounded-full" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
