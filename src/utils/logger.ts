// Conditional Logging Utility
// Provides a centralized logging system that can be toggled on/off

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix?: string;
}

const DEFAULT_CONFIG: LoggerConfig = {
  enabled: import.meta.env.DEV, // Only enabled in development by default
  level: 'debug',
};

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const requestedLevelIndex = levels.indexOf(level);

    return requestedLevelIndex >= currentLevelIndex;
  }

  private formatMessage(message: string): string {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    return `[${timestamp}]${prefix} ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage(message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage(message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage(message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage(message), ...args);
    }
  }

  group(label: string): void {
    if (this.config.enabled) {
      console.group(this.formatMessage(label));
    }
  }

  groupEnd(): void {
    if (this.config.enabled) {
      console.groupEnd();
    }
  }

  table(data: unknown): void {
    if (this.config.enabled) {
      console.table(data);
    }
  }
}

// Create default logger instance
export const logger = new Logger();

// Create logger factory for component-specific loggers
export function createLogger(prefix: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger({ ...config, prefix });
}

// Export type for use in other files
export type { LogLevel, LoggerConfig };
