type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  route?: string;
  action?: string;
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  return JSON.stringify(entry);
}

export const logger = {
  info(message: string, context?: LogContext) {
    console.log(formatLog('info', message, context));
  },

  warn(message: string, context?: LogContext) {
    console.warn(formatLog('warn', message, context));
  },

  error(message: string, error?: unknown, context?: LogContext) {
    const errorData: LogContext = { ...context };
    if (error instanceof Error) {
      errorData.errorName = error.name;
      errorData.errorMessage = error.message;
      errorData.stack = error.stack?.split('\n').slice(0, 5).join('\n');
    } else if (error) {
      errorData.errorRaw = String(error);
    }
    console.error(formatLog('error', message, errorData));
  },

  /** Log an API request for observability */
  apiRequest(route: string, method: string, userId?: string, extra?: Record<string, unknown>) {
    this.info(`${method} ${route}`, { route, action: method, userId, ...extra });
  },

  /** Log an API error with request context */
  apiError(route: string, method: string, error: unknown, userId?: string) {
    this.error(`${method} ${route} failed`, error, { route, action: method, userId });
  },
};
