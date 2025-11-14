'use client';

import { useState } from 'react';
import Head from 'next/head';
import { api } from '@/utils/api';

/**
 * How to test with your Laravel API:
 * 1) Ensure your Laravel backend is running and reachable at NEXT_PUBLIC_API_URL (e.g. http://13.200.224.xxx/api)
 * 2) Set .env.local in this Next.js project: NEXT_PUBLIC_API_URL=http://13.200.224.xxx/api
 * 3) Start Next.js: npm run dev
 * 4) Visit http://localhost:3000/api-login
 * 5) Enter valid Laravel auth credentials and submit; the response is shown below the form and logged to console.
 */
export default function ApiLoginTestPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      // Adjust payload keys to match your Laravel API's expected field names
      // Most Laravel auth endpoints expect: { email, password }
      const response = await api.post('/login', { email, password });
      setResult(response.data);
      // eslint-disable-next-line no-console
      console.log('Login response:', response.data);
    } catch (err) {
      setError({
        message: err.message,
        status: err.status,
        data: err.data
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>API Login Test</title>
      </Head>
      <main style={{ maxWidth: 520, margin: '48px auto', padding: '0 16px' }}>
        <h1 style={{ marginBottom: 16 }}>Laravel API Login Test</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          This page uses the reusable Axios client at <code>src/utils/api.js</code> to POST to
          <code> /login</code> on your Laravel API.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }}
            />
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 14px',
              background: '#111827',
              color: 'white',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Result</h2>
          {!result && !error && <p>No response yet.</p>}
          {result && (
            <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
{JSON.stringify(result, null, 2)}
            </pre>
          )}
          {error && (
            <div style={{ color: '#b91c1c' }}>
              <p><strong>Error:</strong> {error.message}</p>
              {error.status && <p>Status: {error.status}</p>}
              {error.data && (
                <pre style={{ background: '#fef2f2', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
{JSON.stringify(error.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
}


