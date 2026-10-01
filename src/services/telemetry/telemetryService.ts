export const telemetryService = {
  track: (event: string, metadata?: Record<string, unknown>) => {
    console.info(`telemetry:${event}`, metadata ?? {})
  },
}
