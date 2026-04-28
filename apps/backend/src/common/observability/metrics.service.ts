import { Injectable } from '@nestjs/common';

type MetricLabels = Record<string, string | number | boolean | undefined>;

type HistogramSnapshot = {
  sum: number;
  count: number;
  buckets: number[];
};

const DEFAULT_HTTP_BUCKETS = [25, 50, 100, 250, 500, 1000, 2500, 5000];
const DEFAULT_DEPENDENCY_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500];

@Injectable()
export class MetricsService {
  private readonly counters = new Map<string, number>();
  private readonly gauges = new Map<string, number>();
  private readonly histograms = new Map<string, HistogramSnapshot>();

  incrementCounter(name: string, labels?: MetricLabels, value = 1) {
    const key = this.metricKey(name, labels);
    this.counters.set(key, (this.counters.get(key) ?? 0) + value);
  }

  setGauge(name: string, value: number, labels?: MetricLabels) {
    this.gauges.set(this.metricKey(name, labels), value);
  }

  changeGauge(name: string, delta: number, labels?: MetricLabels) {
    const key = this.metricKey(name, labels);
    this.gauges.set(key, (this.gauges.get(key) ?? 0) + delta);
  }

  observeHistogram(
    name: string,
    value: number,
    buckets: number[],
    labels?: MetricLabels,
  ) {
    const key = this.metricKey(name, labels);
    const snapshot = this.histograms.get(key) ?? {
      sum: 0,
      count: 0,
      buckets: Array.from<number>({ length: buckets.length }).fill(0),
    };

    snapshot.sum += value;
    snapshot.count += 1;
    buckets.forEach((bucket, index) => {
      if (value <= bucket) {
        snapshot.buckets[index] += 1;
      }
    });

    this.histograms.set(key, snapshot);
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number,
  ) {
    const labels = {
      method: method.toUpperCase(),
      route: this.normalizeRoute(route),
      status_code: statusCode,
    };

    this.incrementCounter('http_requests_total', labels);
    this.observeHistogram(
      'http_request_duration_ms',
      durationMs,
      DEFAULT_HTTP_BUCKETS,
      labels,
    );

    if (statusCode >= 500) {
      this.incrementCounter('http_request_errors_total', labels);
    }
  }

  recordDependencyHealth(
    dependency: 'database' | 'cache' | 'storage',
    latencyMs: number,
    status: 'up' | 'down',
  ) {
    const labels = { dependency };
    this.observeHistogram(
      'dependency_health_latency_ms',
      latencyMs,
      DEFAULT_DEPENDENCY_BUCKETS,
      labels,
    );
    this.setGauge('dependency_health_up', status === 'up' ? 1 : 0, labels);
  }

  renderPrometheus() {
    const lines: string[] = [];

    this.appendMetricFamily(lines, this.counters, 'counter');
    this.appendMetricFamily(lines, this.gauges, 'gauge');
    this.appendHistogramFamily(lines);

    return `${lines.join('\n')}\n`;
  }

  private appendMetricFamily(
    lines: string[],
    store: Map<string, number>,
    type: 'counter' | 'gauge',
  ) {
    const grouped = new Map<string, Array<{ key: string; value: number }>>();
    for (const [key, value] of store.entries()) {
      const name = key.split('{')[0] ?? key;
      const items = grouped.get(name) ?? [];
      items.push({ key, value });
      grouped.set(name, items);
    }

    for (const [name, items] of grouped.entries()) {
      lines.push(`# TYPE ${name} ${type}`);
      for (const item of items.sort((a, b) => a.key.localeCompare(b.key))) {
        lines.push(`${item.key} ${item.value}`);
      }
    }
  }

  private appendHistogramFamily(lines: string[]) {
    const grouped = new Map<
      string,
      Array<{ key: string; snapshot: HistogramSnapshot }>
    >();

    for (const [key, snapshot] of this.histograms.entries()) {
      const name = key.split('{')[0] ?? key;
      const items = grouped.get(name) ?? [];
      items.push({ key, snapshot });
      grouped.set(name, items);
    }

    for (const [name, items] of grouped.entries()) {
      const buckets =
        name === 'http_request_duration_ms'
          ? DEFAULT_HTTP_BUCKETS
          : DEFAULT_DEPENDENCY_BUCKETS;
      lines.push(`# TYPE ${name} histogram`);
      for (const item of items.sort((a, b) => a.key.localeCompare(b.key))) {
        const labels = this.parseLabels(item.key);
        buckets.forEach((bucket, index) => {
          lines.push(
            `${name}_bucket${this.renderLabels({ ...labels, le: bucket })} ${item.snapshot.buckets[index]}`,
          );
        });
        lines.push(
          `${name}_bucket${this.renderLabels({ ...labels, le: '+Inf' })} ${item.snapshot.count}`,
        );
        lines.push(
          `${name}_sum${this.renderLabels(labels)} ${item.snapshot.sum}`,
        );
        lines.push(
          `${name}_count${this.renderLabels(labels)} ${item.snapshot.count}`,
        );
      }
    }
  }

  private metricKey(name: string, labels?: MetricLabels) {
    return `${name}${this.renderLabels(labels)}`;
  }

  private renderLabels(labels?: MetricLabels) {
    if (!labels) {
      return '';
    }

    const entries = Object.entries(labels)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)] as const)
      .sort(([left], [right]) => left.localeCompare(right));

    if (entries.length === 0) {
      return '';
    }

    const content = entries
      .map(([key, value]) => `${key}="${this.escapeLabelValue(value)}"`)
      .join(',');
    return `{${content}}`;
  }

  private parseLabels(key: string) {
    const start = key.indexOf('{');
    if (start === -1) {
      return {};
    }

    const raw = key.slice(start + 1, -1);
    if (!raw) {
      return {};
    }

    return Object.fromEntries(
      raw.split(',').map((entry) => {
        const [label, rawValue] = entry.split('=');
        return [label, rawValue?.slice(1, -1) ?? ''];
      }),
    );
  }

  private escapeLabelValue(value: string) {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  private normalizeRoute(route: string) {
    return route
      .split('?')[0]
      .replace(
        /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
        ':id',
      )
      .replace(/\/\d+\b/g, '/:id');
  }
}
