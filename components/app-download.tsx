import Link from "next/link";

const androidUrl = process.env.NEXT_PUBLIC_ANDROID_APP_URL;
const iosUrl = process.env.NEXT_PUBLIC_IOS_APP_URL;

function StoreBadge({ label, url }: { label: string; url?: string }) {
  if (!url) {
    return <span className="store-badge store-badge-disabled"><small>{label}</small><b>Coming soon</b></span>;
  }
  return <a className="store-badge" href={url} target="_blank" rel="noreferrer"><small>{label}</small><b>Download app ↗</b></a>;
}

export function AppDownloadSection() {
  return (
    <section className="app-download-section" id="download-app">
      <div className="app-download-copy">
        <span className="eyebrow">TAKE OPERLYNT WITH YOU</span>
        <h2>Career prep that fits in your pocket.</h2>
        <p>Use the installable web app today. Native Play Store and App Store buttons will activate as soon as the iOS and Android listings are published.</p>
        <Link className="text-link" href="/?install=1">Install the web app <span aria-hidden="true">↗</span></Link>
      </div>
      <div className="store-badges" aria-label="App download options">
        <StoreBadge label="Google Play" url={androidUrl} />
        <StoreBadge label="App Store" url={iosUrl} />
      </div>
    </section>
  );
}
