import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// Initialize Sentry
export const initSentry = () => {
  Sentry.init({
    dsn: Constants.expoConfig?.extra?.sentryDsn || '',
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    // Enable auto session tracking
    enableAutoSessionTracking: true,
    // Sessions close after app is in background for 30 seconds
    sessionTrackingIntervalMillis: 30000,
    // Debug mode in development
    debug: __DEV__,
    // Enable native crash reporting
    enableNativeCrashHandling: true,
    // Environment
    environment: __DEV__ ? 'development' : 'production',
    // Release version
    release: `${Constants.expoConfig?.name}@${Constants.expoConfig?.version}`,
    // Dist (build number)
    dist: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode?.toString(),
    // Integrations
    integrations: [
      Sentry.reactNativeTracingIntegration(),
    ],
    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }
      return event;
    },
    // Don't capture in development
    enabled: !__DEV__,
  });
};

// Set user context (call after login)
export const setUserContext = (
  userId: string,
  email: string,
  name?: string,
  type?: string
) => {
  Sentry.setUser({
    id: userId,
    email: email,
    username: name,
    // Custom data
    segment: type,
  });
};

// Clear user context (call after logout)
export const clearUserContext = () => {
  Sentry.setUser(null);
};

// Add breadcrumb for navigation
export const addNavigationBreadcrumb = (
  from: string,
  to: string,
  params?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Navigated from ${from} to ${to}`,
    data: params,
    level: 'info',
  });
};

// Add breadcrumb for user action
export const addActionBreadcrumb = (
  action: string,
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    category: 'user.action',
    message: action,
    data,
    level: 'info',
  });
};

// Add breadcrumb for API call
export const addApiBreadcrumb = (
  method: string,
  url: string,
  statusCode?: number,
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    category: 'api',
    message: `${method} ${url}`,
    data: {
      ...data,
      status_code: statusCode,
    },
    level: statusCode && statusCode >= 400 ? 'error' : 'info',
  });
};

// Capture exception with additional context
export const captureException = (
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }
) => {
  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    if (context?.level) {
      scope.setLevel(context.level);
    }
    Sentry.captureException(error);
  });
};

// Capture message
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info'
) => {
  Sentry.captureMessage(message, level);
};

// Start a transaction for performance monitoring
export const startTransaction = (
  name: string,
  op: string = 'navigation'
) => {
  return Sentry.startSpan({
    name,
    op,
  }, () => {});
};

// Wrap component with Sentry error boundary
export const withErrorBoundary = Sentry.wrap;

// Create Sentry navigation integration for React Navigation
export const createNavigationIntegration = () => {
  return Sentry.reactNavigationIntegration();
};

// Performance monitoring helpers
export const measurePerformance = async <T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> => {
  const start = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - start;
    
    Sentry.addBreadcrumb({
      category: 'performance',
      message: operationName,
      data: { duration_ms: duration },
      level: 'info',
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${operationName} (failed)`,
      data: { duration_ms: duration },
      level: 'error',
    });
    
    throw error;
  }
};

// Error boundary fallback component type
export interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
}

// Export Sentry for direct access if needed
export { Sentry };
