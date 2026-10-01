export class BackendError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'BackendError'
  }
}