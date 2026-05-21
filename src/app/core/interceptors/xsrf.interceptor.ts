import { HttpInterceptorFn } from '@angular/common/http';

export const xsrfInterceptor: HttpInterceptorFn = (req, next) => {
  // Only add XSRF token to mutating requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method.toUpperCase())) {
    const token = getCookie('XSRF-TOKEN');
    
    if (token) {
      const clonedReq = req.clone({
        setHeaders: {
          'X-XSRF-TOKEN': token
        }
      });
      return next(clonedReq);
    }
  }
  
  return next(req);
};

/**
 * Helper to extract cookie value by name
 */
function getCookie(name: string): string | null {
  const nameLenPlus = name.length + 1;
  return document.cookie
    .split(';')
    .map(c => c.trim())
    .filter(cookie => cookie.substring(0, nameLenPlus) === `${name}=`)
    .map(cookie => decodeURIComponent(cookie.substring(nameLenPlus)))[0] || null;
}
