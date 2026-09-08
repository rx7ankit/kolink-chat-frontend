export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-2xl font-semibold">That page isn’t in the mockup</h1>
      <p className="text-sm text-muted-foreground">Head back to Home or the marketing site.</p>
    </div>
  );
}
