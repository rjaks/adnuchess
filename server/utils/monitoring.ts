/**
 * Production monitoring and alerting configuration
 * This file configures monitoring, metrics, and alerting for the AdNU Chess platform
 */

import { log } from './logger'

export interface MetricEvent {
  name: string
  value: number
  tags?: Record<string, string>
  timestamp?: number
}

export interface AlertConfig {
  name: string
  condition: (metric: MetricEvent) => boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  cooldown: number // Minutes between alerts
  description: string
}

// Application metrics
export class MetricsCollector {
  private metrics: Map<string, MetricEvent[]> = new Map()
  private alertHistory: Map<string, number> = new Map()
  
  constructor(private alerts: AlertConfig[] = []) {
    // Set up periodic cleanup
    setInterval(() => this.cleanup(), 5 * 60 * 1000) // 5 minutes
  }

  // Record a metric
  record(name: string, value: number, tags?: Record<string, string>): void {
    const metric: MetricEvent = {
      name,
      value,
      tags,
      timestamp: Date.now()
    }

    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const metrics = this.metrics.get(name)!
    metrics.push(metric)

    // Keep only last 1000 metrics per type
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000)
    }

    // Check alerts
    this.checkAlerts(metric)

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      log.debug(`Metric recorded: ${name}=${value}`, { tags })
    }
  }

  // Get metrics for the last period
  getMetrics(name: string, minutes: number = 5): MetricEvent[] {
    const metrics = this.metrics.get(name) || []
    const cutoff = Date.now() - (minutes * 60 * 1000)
    return metrics.filter(m => (m.timestamp || 0) > cutoff)
  }

  // Get average value for a metric
  getAverage(name: string, minutes: number = 5): number {
    const metrics = this.getMetrics(name, minutes)
    if (metrics.length === 0) return 0
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0)
    return sum / metrics.length
  }

  // Check if any alerts should be triggered
  private checkAlerts(metric: MetricEvent): void {
    for (const alert of this.alerts) {
      // Check cooldown
      const lastAlert = this.alertHistory.get(alert.name) || 0
      const cooldownMs = alert.cooldown * 60 * 1000
      
      if (Date.now() - lastAlert < cooldownMs) {
        continue
      }

      // Check condition
      if (alert.condition(metric)) {
        this.triggerAlert(alert, metric)
      }
    }
  }

  // Trigger an alert
  private triggerAlert(alert: AlertConfig, metric: MetricEvent): void {
    this.alertHistory.set(alert.name, Date.now())

    log.error(`🚨 ALERT: ${alert.name}`, undefined, {
      severity: alert.severity,
      description: alert.description,
      metric: metric.name,
      value: metric.value,
      tags: metric.tags,
      timestamp: new Date().toISOString()
    })

    // In production, you would send to your alerting system
    // Example: Slack, PagerDuty, email, etc.
    if (process.env.NODE_ENV === 'production') {
      this.sendAlert(alert, metric)
    }
  }

  // Send alert to external systems
  private async sendAlert(alert: AlertConfig, metric: MetricEvent): Promise<void> {
    // Implement your alerting logic here
    // Examples:
    
    // Slack webhook
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 AdNU Chess Alert: ${alert.name}`,
            blocks: [{
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${alert.name}*\n${alert.description}\nMetric: ${metric.name} = ${metric.value}`
              }
            }]
          })
        })
      } catch (error) {
        log.error('Failed to send Slack alert', error)
      }
    }

    // Email notification (if SMTP configured)
    // Discord webhook
    // PagerDuty API
    // etc.
  }

  // Clean up old metrics
  private cleanup(): void {
    const cutoff = Date.now() - (60 * 60 * 1000) // 1 hour
    
    for (const [name, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => (m.timestamp || 0) > cutoff)
      this.metrics.set(name, filtered)
    }
  }

  // Generate health report
  getHealthReport(): Record<string, any> {
    const report: Record<string, any> = {}
    
    for (const [name, metrics] of this.metrics.entries()) {
      const recent = this.getMetrics(name, 5)
      if (recent.length > 0) {
        report[name] = {
          count: recent.length,
          average: this.getAverage(name, 5),
          latest: recent[recent.length - 1]?.value || 0,
          trend: recent.length > 1 ? 
            (recent[recent.length - 1].value - recent[0].value) : 0
        }
      }
    }
    
    return report
  }
}

// Default alert configurations
export const defaultAlerts: AlertConfig[] = [
  {
    name: 'High Error Rate',
    condition: (metric) => metric.name === 'error_rate' && metric.value > 0.05, // 5%
    severity: 'high',
    cooldown: 5,
    description: 'Error rate is above 5%'
  },
  {
    name: 'High Response Time',
    condition: (metric) => metric.name === 'response_time' && metric.value > 5000, // 5s
    severity: 'medium',
    cooldown: 10,
    description: 'Average response time is above 5 seconds'
  },
  {
    name: 'Low Active Games',
    condition: (metric) => metric.name === 'active_games' && metric.value < 1,
    severity: 'low',
    cooldown: 30,
    description: 'No active games for extended period'
  },
  {
    name: 'High Memory Usage',
    condition: (metric) => metric.name === 'memory_usage' && metric.value > 0.9, // 90%
    severity: 'high',
    cooldown: 5,
    description: 'Memory usage is above 90%'
  },
  {
    name: 'Database Connection Issues',
    condition: (metric) => metric.name === 'db_errors' && metric.value > 0,
    severity: 'critical',
    cooldown: 1,
    description: 'Database connection errors detected'
  }
]

// Global metrics collector
export const metrics = new MetricsCollector(defaultAlerts)

// Helper functions for common metrics
export const recordMetrics = {
  responseTime: (endpoint: string, duration: number) => {
    metrics.record('response_time', duration, { endpoint })
  },
  
  error: (endpoint: string, errorType: string) => {
    metrics.record('error_count', 1, { endpoint, errorType })
  },
  
  gameAction: (action: string, gameMode: string) => {
    metrics.record('game_actions', 1, { action, gameMode })
  },
  
  activeUsers: (count: number) => {
    metrics.record('active_users', count)
  },
  
  memoryUsage: () => {
    const usage = process.memoryUsage()
    metrics.record('memory_usage', usage.heapUsed / usage.heapTotal)
    metrics.record('memory_heap_used', usage.heapUsed)
  },
  
  dbQuery: (operation: string, duration: number, success: boolean) => {
    metrics.record('db_query_time', duration, { operation })
    if (!success) {
      metrics.record('db_errors', 1, { operation })
    }
  }
}

// Start background monitoring
if (process.env.NODE_ENV === 'production') {
  // Record memory usage every minute
  setInterval(() => {
    recordMetrics.memoryUsage()
  }, 60 * 1000)
  
  log.info('Production monitoring initialized')
}
