import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('renders prometheus metrics for http and dependency observations', () => {
    const metrics = new MetricsService();

    metrics.recordHttpRequest('get', '/posts/123', 200, 42);
    metrics.recordHttpRequest('post', '/auth/login', 500, 120);
    metrics.recordDependencyHealth('database', 18, 'up');
    metrics.incrementCounter('auth_failures_total', {
      reason: 'invalid_credentials',
    });
    metrics.changeGauge('websocket_connections', 2);

    const output = metrics.renderPrometheus();

    expect(output).toContain('# TYPE http_requests_total counter');
    expect(output).toContain('route="/posts/:id"');
    expect(output).toContain('# TYPE http_request_duration_ms histogram');
    expect(output).toContain('# TYPE dependency_health_latency_ms histogram');
    expect(output).toContain(
      'auth_failures_total{reason="invalid_credentials"} 1',
    );
    expect(output).toContain('# TYPE websocket_connections gauge');
  });
});
