import Link from "next/link";
export const metadata={title:"Verify email",robots:{index:false,follow:false}};
export default function Page(){return <main className="auth-shell"><section className="auth-card"><Link className="auth-brand" href="/">Operlynt</Link><span className="eyebrow">ONE LAST STEP</span><h1>Check your inbox.</h1><p>Use the verification link we sent to confirm your email and finish creating your account.</p><Link className="btn" href="/login">Go to sign in</Link></section></main>}
