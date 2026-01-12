import { createAdminClient } from './supabase-admin';

type LogLevel = 'info' | 'warning' | 'error' | 'debug';

interface LogContext {
    feed_id?: string;
    opportunity_id?: string;
    execution_time_ms?: number;
    [key: string]: any;
}

/**
 * Logger utility that writes to processing_logs table
 * Also logs to console in development mode
 */
export const logger = {
    async log(level: LogLevel, message: string, context?: LogContext) {
        try {
            const supabase = createAdminClient();

            // Write to database
            const { error } = await supabase.from('processing_logs').insert({
                level,
                message,
                context: context || null,
                feed_id: context?.feed_id || null,
                opportunity_id: context?.opportunity_id || null,
                execution_time_ms: context?.execution_time_ms || null
            });

            if (error) {
                console.error('[Logger] Failed to write log to database:', error);
            }

            // Also log to console in development
            if (process.env.NODE_ENV === 'development') {
                const consoleMethod = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log';
                console[consoleMethod](`[${level.toUpperCase()}] ${message}`, context || '');
            }
        } catch (error) {
            // Fallback to console if database logging fails
            console.error('[Logger] Fatal error in logger:', error);
            console.log(`[${level.toUpperCase()}] ${message}`, context || '');
        }
    },

    info(message: string, context?: LogContext) {
        return logger.log('info', message, context);
    },

    warning(message: string, context?: LogContext) {
        return logger.log('warning', message, context);
    },

    error(message: string, context?: LogContext) {
        return logger.log('error', message, context);
    },

    debug(message: string, context?: LogContext) {
        return logger.log('debug', message, context);
    }
};
