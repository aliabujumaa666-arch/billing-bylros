import { PostgrestError } from '@supabase/supabase-js';

export interface AppError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export const parseSupabaseError = (error: PostgrestError | Error | unknown): AppError => {
  if (!error) {
    return { message: 'An unknown error occurred' };
  }

  if (error instanceof Error) {
    if ('code' in error && 'details' in error && 'hint' in error) {
      const pgError = error as PostgrestError;
      return {
        message: pgError.message || 'Database error occurred',
        code: pgError.code,
        details: pgError.details,
        hint: pgError.hint,
      };
    }

    return { message: error.message };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  return { message: 'An unexpected error occurred' };
};

export const getErrorMessage = (error: unknown): string => {
  const appError = parseSupabaseError(error);

  if (appError.hint) {
    return `${appError.message}. ${appError.hint}`;
  }

  if (appError.details) {
    return `${appError.message}. ${appError.details}`;
  }

  return appError.message;
};

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.toLowerCase().includes('network') ||
           error.message.toLowerCase().includes('fetch') ||
           error.message.toLowerCase().includes('connection');
  }
  return false;
};

export const isAuthError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    return code === 'PGRST301' || code === '401' || code === '403';
  }
  return false;
};

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isNetworkError(error) || i === maxRetries - 1) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
    }
  }

  throw lastError;
};
