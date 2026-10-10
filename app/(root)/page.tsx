import Link from "next/link";
import { defaultLocale } from "@/lib/i18n";

// Static hosts can't redirect on the server, so the root page forwards with a meta refresh.
export default function RootPage() {
  const target = `/${defaultLocale}/`;
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <p className="p-8 text-center">
        <Link href="/fa/">ورود به ایرانیوم</Link> · <Link href="/en/">Enter Iraneum</Link>
      </p>
    </>
  );
}
