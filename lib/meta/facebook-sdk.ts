type FacebookSdk = {
  init: (opts: { appId: string; cookie?: boolean; xfbml?: boolean; version: string }) => void;
  login: (
    callback: (response: { authResponse?: { code?: string }; status?: string }) => void,
    options: Record<string, unknown>,
  ) => void;
};

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

let loading: Promise<void> | null = null;

export function facebookSdkReady() {
  return Boolean(typeof window !== "undefined" && window.FB);
}

export function loadFacebookSdk(appId: string, version: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Meta SDK runs in the browser"));
  }
  const graphVersion = version.startsWith("v") ? version : `v${version}`;
  if (window.FB) {
    window.FB.init({ appId, cookie: true, xfbml: false, version: graphVersion });
    return Promise.resolve();
  }
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB?.init({ appId, cookie: true, xfbml: false, version: graphVersion });
      resolve();
    };
    const existing = document.getElementById("facebook-jssdk");
    if (existing) return;
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.onerror = () => {
      loading = null;
      reject(new Error("Could not load Meta SDK"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export type WhatsAppSignupSession = {
  waba_id: string | null;
  phone_number_id: string | null;
};

export function listenWhatsAppEmbeddedSignup(session: WhatsAppSignupSession) {
  const onMessage = (event: MessageEvent) => {
    if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") {
      return;
    }
    let payload: unknown = event.data;
    if (typeof event.data === "string") {
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }
    }
    if (!payload || typeof payload !== "object") return;
    const data = payload as { type?: string; data?: { waba_id?: string; phone_number_id?: string } };
    if (data.type !== "WA_EMBEDDED_SIGNUP") return;
    if (data.data?.waba_id) session.waba_id = String(data.data.waba_id);
    if (data.data?.phone_number_id) session.phone_number_id = String(data.data.phone_number_id);
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

export function loginWhatsAppEmbeddedSignup(
  configId: string,
  onResponse: (code: string | null) => void,
) {
  if (!window.FB) {
    onResponse(null);
    return;
  }
  window.FB.login(
    (response) => {
      onResponse(response.authResponse?.code?.trim() || null);
    },
    {
      config_id: configId,
      response_type: "code",
      override_default_response_type: true,
      extras: {
        setup: {},
        featureType: "whatsapp_business_app_onboarding",
        sessionInfoVersion: "3",
      },
    },
  );
}
