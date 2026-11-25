import type {MetadataRoute} from "next";
const siteUrl=(process.env.NEXT_PUBLIC_SITE_URL??"https://operlynt-hmuwvgxe.manus.space").replace(/\/$/,"");
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:"*",allow:"/",disallow:["/dashboard","/profile","/account","/login","/register","/forgot-password","/reset-password","/verify-email","/auth","/api"]},sitemap:`${siteUrl}/sitemap.xml`}}
