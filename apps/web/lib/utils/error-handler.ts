import { logger } from './logger';

/**
 * Custom application error class
 */
export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public code?: string,
        public context?: any
    ) {
        super(message);
        this.name = 'AppError';
    }
}

/**
 * Centralized error handler for API routes
 * Logs error and returns consistent error response
 */
export async function handleAPIError(
    error: unknown,
    context?: any
): Promise<Response> {
    // Handle custom AppError
    if (error instanceof AppError) {
        await logger.error(error.message, {
            ...context,
            code: error.code,
            statusCode: error.statusCode
        });

        return Response.json(
            {
                error: error.message,
                code: error.code
            },
            { status: error.statusCode }
        );
    }

    // Handle standard Error
    if (error instanceof Error) {
        await logger.error(error.message, {
            ...context,
            stack: error.stack
        });

        return Response.json(
            { error: error.message },
            { status: 500 }
        );
    }

    // Handle unknown errors
    await logger.error('Unknown error occurred', {
        error: String(error),
        context
    });

    return Response.json(
        { error: 'Internal server error' },
        { status: 500 }
    );
}

/**
 * Verify authentication header (for cron endpoints)
 */
export function verifyAuthHeader(request: Request, expectedSecret: string): boolean {
    const authHeader = request.headers.get('authorization');
    return authHeader === `Bearer ${expectedSecret}`;
}

/**
 * Verify admin role from Supabase JWT
 * Note: This is a simplified version. In production, parse the JWT properly.
 */
export function isAdmin(headers: Headers): boolean {
    // TODO: Implement proper JWT parsing and role verification
    // For now, this is a placeholder
    return true;
}

/**
 * Common error factory functions
 */
export const errors = {
    unauthorized: (message = 'Unauthorized') =>
        new AppError(message, 401, 'UNAUTHORIZED'),

    forbidden: (message = 'Forbidden') =>
        new AppError(message, 403, 'FORBIDDEN'),

    notFound: (resource = 'Resource', id?: string) =>
        new AppError(
            `${resource}${id ? ` with id ${id}` : ''} not found`,
            404,
            'NOT_FOUND'
        ),

    badRequest: (message: string) =>
        new AppError(message, 400, 'BAD_REQUEST'),

    validation: (message: string) =>
        new AppError(message, 422, 'VALIDATION_ERROR'),

    conflict: (message: string) =>
        new AppError(message, 409, 'CONFLICT'),

    internalError: (message = 'Internal server error') =>
        new AppError(message, 500, 'INTERNAL_ERROR'),

    serviceUnavailable: (service: string) =>
        new AppError(`${service} is currently unavailable`, 503, 'SERVICE_UNAVAILABLE')
};
