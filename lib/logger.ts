/**
 * Structured Logging Utility
 * 
 * Provides consistent logging across the application with context tracking.
 * Addresses todo.md Section 8.3: Application logging & monitoring
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogContext {
  userId?: string;
  tenantId?: string;
  route?: string;
  action?: string;
  correlationId?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

/**
 * Main logger class with structured output
 */
class Logger {
  private defaultContext: LogContext = {};

  /**
   * Set default context for all log entries
   */
  setDefaultContext(context: LogContext) {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  /**
   * Clear default context
   */
  clearDefaultContext() {
    this.defaultContext = {};
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.defaultContext, ...context },
    };

    if (error) {
      entry.error = {
        message: error.message,
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }

    // In development, use console methods for better formatting
    if (process.env.NODE_ENV === 'development') {
      const contextStr = Object.keys(entry.context || {}).length > 0 
        ? ` [${Object.entries(entry.context || {}).map(([k, v]) => `${k}:${v}`).join(', ')}]`
        : '';
      
      const fullMessage = `${entry.timestamp} [${level}]${contextStr} ${message}`;
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(fullMessage, error || '');
          break;
        case LogLevel.INFO:
          console.info(fullMessage);
          break;
        case LogLevel.WARN:
          console.warn(fullMessage, error || '');
          break;
        case LogLevel.ERROR:
          console.error(fullMessage, error || '');
          break;
      }
    } else {
      // In production, output structured JSON for log aggregation
      console.log(JSON.stringify(entry));
    }

    // TODO: Add integration with external monitoring service (Sentry, OpenTelemetry)
    // if (process.env.ENABLE_EXTERNAL_MONITORING === 'true') {
    //   sendToMonitoringService(entry);
    // }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext, error?: Error) {
    this.log(LogLevel.WARN, message, context, error);
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Create a child logger with inherited context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.setDefaultContext({ ...this.defaultContext, ...context });
    return childLogger;
  }
}

// Export singleton logger instance
export const logger = new Logger();

/**
 * Helper to create a logger with route context
 */
export function createRouteLogger(route: string, additionalContext?: LogContext): Logger {
  return logger.child({ route, ...additionalContext });
}

/**
 * Performance timing utility
 */
export class Timer {
  private startTime: number;
  private label: string;
  private context?: LogContext;

  constructor(label: string, context?: LogContext) {
    this.label = label;
    this.context = context;
    this.startTime = Date.now();
    logger.debug(`${label} started`, context);
  }

  /**
   * Stop timer and log duration
   */
  end() {
    const duration = Date.now() - this.startTime;
    logger.info(`${this.label} completed`, { ...this.context, durationMs: duration });
    return duration;
  }
}
