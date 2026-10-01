export function ErrorPage({ message = 'Something went wrong while loading this view.' }: { message?: string }) {
  return (
    <section className="empty-state error-state">
      <h2>Unexpected error</h2>
      <p>{message}</p>
    </section>
  )
}
