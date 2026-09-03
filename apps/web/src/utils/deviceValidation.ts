/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Strict Device & Browser Validation Utility (iOS + Safari Engine Detection)
 */

export interface DeviceValidationResult {
  isIOS: boolean;
  isMac: boolean;
  isSafari: boolean;
  isValid: boolean;
  reason?: "NOT_IOS" | "NOT_SAFARI" | "IN_APP_BROWSER";
  detectedOS: string;
  detectedBrowser: string;
  userAgent: string;
}

export function checkIsIOSSafari(): DeviceValidationResult {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      isIOS: true,
      isMac: true,
      isSafari: true,
      isValid: true,
      detectedOS: "iOS Device",
      detectedBrowser: "Safari",
      userAgent: "",
    };
  }

  // Check manual testing bypass in localStorage
  const hasLocalBypass = localStorage.getItem("BERSEKA_DEV_BYPASS_IOS_GATE") === "true";

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
  const platform = navigator.platform || "";

  // 1. Strict iOS Hardware & OS Detection (iPhone, iPad, iPod, iPadOS)
  const isIPhone = /iPhone/i.test(ua);
  const isIPad =
    /iPad/i.test(ua) ||
    (platform === "MacIntel" && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1);
  const isIPod = /iPod/i.test(ua);
  const isIOS = isIPhone || isIPad || isIPod;

  // 2. macOS / MacBook Detection
  const isMac = /Macintosh|Mac OS X|Mac_PowerPC/i.test(ua) || (platform === "MacIntel" && !isIPad);

  // 3. Identify Non-Safari Browser Engines on iOS
  const isCriOS = /CriOS/i.test(ua); // Chrome on iOS
  const isFxiOS = /FxiOS/i.test(ua); // Firefox on iOS
  const isEdgiOS = /EdgiOS/i.test(ua); // Edge on iOS
  const isOperaIOS = /OPT|OPiOS/i.test(ua); // Opera on iOS
  const isUC = /UCBrowser/i.test(ua);
  const isInApp = /FBAN|FBAV|Instagram|Line|Twitter|MicroMessenger|Snapchat|Bytedance|TikTok|wv/i.test(ua);

  // 4. Genuine Safari Engine Validation
  const isSafariCore = /Safari/i.test(ua) && /Version\//i.test(ua);
  const isSafari = isSafariCore && !isCriOS && !isFxiOS && !isEdgiOS && !isOperaIOS && !isUC && !isInApp;

  // Human readable OS name
  let detectedOS = "Perangkat Non-iOS / Desktop";
  if (isIPhone) detectedOS = "Apple iPhone (iOS)";
  else if (isIPad) detectedOS = "Apple iPad (iPadOS)";
  else if (isIPod) detectedOS = "Apple iPod Touch (iOS)";
  else if (isMac) detectedOS = "Apple MacBook / Mac (macOS)";
  else if (/Android/i.test(ua)) detectedOS = "Android OS Device";
  else if (/Windows/i.test(ua)) detectedOS = "Windows PC / Desktop";
  else if (/Linux/i.test(ua)) detectedOS = "Linux Desktop";

  // Human readable Browser name
  let detectedBrowser = "Peramban Web Tidak Dikenal";
  if (isInApp) detectedBrowser = "In-App Browser (Instagram / FB / Line)";
  else if (isCriOS) detectedBrowser = "Google Chrome (iOS)";
  else if (isFxiOS) detectedBrowser = "Mozilla Firefox (iOS)";
  else if (isEdgiOS) detectedBrowser = "Microsoft Edge (iOS)";
  else if (isOperaIOS) detectedBrowser = "Opera Touch (iOS)";
  else if (isSafari) detectedBrowser = "Apple Safari WebKit";
  else if (/Chrome/i.test(ua) && !/Edge|Edg/i.test(ua)) detectedBrowser = "Google Chrome";
  else if (/Firefox/i.test(ua)) detectedBrowser = "Mozilla Firefox";
  else if (/Edge|Edg/i.test(ua)) detectedBrowser = "Microsoft Edge";
  else if (/Opera|OPR/i.test(ua)) detectedBrowser = "Opera Browser";

  if (hasLocalBypass) {
    return {
      isIOS: true,
      isMac: true,
      isSafari: true,
      isValid: true,
      detectedOS: `${detectedOS} (Bypass Pengembang Aktif)`,
      detectedBrowser,
      userAgent: ua,
    };
  }

  // Determine validity: Strict iOS + Safari WebKit
  let isValid = false;
  let reason: "NOT_IOS" | "NOT_SAFARI" | "IN_APP_BROWSER" | undefined;

  if (!isIOS) {
    isValid = false;
    reason = "NOT_IOS";
  } else if (isInApp) {
    isValid = false;
    reason = "IN_APP_BROWSER";
  } else if (!isSafari) {
    isValid = false;
    reason = "NOT_SAFARI";
  } else {
    isValid = true;
  }

  return {
    isIOS,
    isMac,
    isSafari,
    isValid,
    reason,
    detectedOS,
    detectedBrowser,
    userAgent: ua,
  };
}
