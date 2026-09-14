import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-wellness-bg px-4 text-center">
      <h1 className="text-4xl font-serif font-bold text-wellness-primaryDark mb-4">
        404 - Page Not Found
      </h1>
      <p className="text-wellness-muted mb-6">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-full bg-wellness-primary text-white font-medium hover:bg-wellness-primaryDark transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
