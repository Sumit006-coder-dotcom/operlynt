"use client";
import {useEffect,useSyncExternalStore} from "react";
const clientId=process.env.NEXT_PUBLIC_ADSENSE_CMP_READY==="true"?(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID??""):"",slotId=process.env.NEXT_PUBLIC_ADSENSE_LEARNING_SLOT??"";
function subscribe(callback:()=>void){window.addEventListener("storage",callback);window.addEventListener("operlynt-consent-change",callback);return()=>{window.removeEventListener("storage",callback);window.removeEventListener("operlynt-consent-change",callback)}}
function adsAllowed(){return typeof window!=="undefined"&&localStorage.getItem("operlynt-ads-consent")==="yes"}
export function PublicAdSlot(){const consented=useSyncExternalStore(subscribe,adsAllowed,()=>false);useEffect(()=>{if(consented&&clientId&&slotId){try{(window.adsbygoogle=window.adsbygoogle??[]).push({})}catch{}}},[consented]);if(!clientId||!slotId||!consented)return null;return <aside className="public-ad-slot" aria-label="Advertisement"><span>Advertisement</span><ins className="adsbygoogle" style={{display:"block",minHeight:90}} data-ad-client={clientId} data-ad-slot={slotId} data-ad-format="auto" data-full-width-responsive="true"/></aside>}
