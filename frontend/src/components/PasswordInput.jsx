import { useState } from 'react';

export default function PasswordInput({
  name,
  value,
  onChange,
  placeholder = 'Please enter your password',
  autoComplete = 'current-password',
  required = true,
  minLength,
  id,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="password-field">
      <input
        id={id}
        name={name}
        type={showPassword ? 'text' : 'password'}
        className="form-control"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setShowPassword((v) => !v)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        aria-pressed={showPassword}
        tabIndex={0}
      >
        {showPassword ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 3l18 18M10.58 10.58a2 2 0 002.84 2.84M9.88 5.09A10.94 10.94 0 0112 5c5.5 0 9.5 4.5 10 7-.21.63-.55 1.24-1 1.78M6.11 6.11C3.6 7.87 2 10 2 12c0 2 1.5 4.5 4 6.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
          </svg>
        )}
      </button>
    </div>
  );
}
