/**
 * Minimal layout for print route - no sidebar, no dashboard chrome
 */
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}
