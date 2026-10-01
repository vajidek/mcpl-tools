import { Component, type ErrorInfo, type ReactNode } from 'react'

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Boundary captured error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error as Error | undefined
      const errorMessage = error && typeof error.message === 'string' ? error.message : 'Unexpected application error.'

      return (
        <section className="empty-state error-state">
          <h2>Something went wrong</h2>
          <p>{errorMessage}</p>
        </section>
      )
    }

    return this.props.children
  }
}
