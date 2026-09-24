import { useEffect, useRef } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({ onCredential, disabled, text = 'signin_with' }) {
  const divRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !divRef.current) return undefined;

    let cancelled = false;

    const handleCredential = (response) => {
      if (response?.credential) {
        onCredentialRef.current(response.credential);
      }
    };

    const mountButton = () => {
      if (cancelled || !divRef.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
      });
      divRef.current.innerHTML = '';
      const width = Math.min(400, divRef.current.parentElement?.clientWidth || 400);
      window.google.accounts.id.renderButton(divRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text,
        width,
      });
    };

    if (window.google?.accounts?.id) {
      mountButton();
    } else {
      const existing = document.querySelector('script[data-google-gsi]');
      if (existing) {
        existing.addEventListener('load', mountButton);
        return () => {
          cancelled = true;
          existing.removeEventListener('load', mountButton);
        };
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.dataset.googleGsi = 'true';
      script.onload = mountButton;
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div
      className="google-signin-btn"
      ref={divRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '1rem',
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    />
  );
}
