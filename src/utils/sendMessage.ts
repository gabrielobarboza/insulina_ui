export function sendMessage(type: string, data: any) {
  if(typeof window === 'object' && window)
    window.postMessage({
      type,
      ...(data ? data : {})
    }, window.origin)
}