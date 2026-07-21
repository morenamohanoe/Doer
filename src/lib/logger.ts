export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export function logError(messageOrError: any, error?: any, context?: Record<string, any>) {
  let message = 'An error occurred';
  let err = error;

  if (typeof messageOrError === 'string') {
    message = messageOrError;
  } else if (messageOrError instanceof Error || (messageOrError && typeof messageOrError === 'object' && 'message' in messageOrError)) {
    err = messageOrError;
    message = err.message || 'An error occurred';
  } else if (messageOrError !== undefined && messageOrError !== null) {
    message = String(messageOrError);
  }

  const logPayload = {
    level: LogLevel.ERROR,
    message,
    timestamp: new Date().toISOString(),
    ...(context && { context }),
    ...(err && {
      errorName: err?.name,
      errorMessage: err?.message,
      errorCode: err?.code
    })
  };
  
  console.error(`[${LogLevel.ERROR}] ${message}`, logPayload);
}

export function logWarn(messageOrData: any, data?: any) {
  console.warn(`[${LogLevel.WARN}]`, messageOrData, data);
}

export function logInfo(messageOrData: any, data?: any) {
  console.info(`[${LogLevel.INFO}]`, messageOrData, data);
}
