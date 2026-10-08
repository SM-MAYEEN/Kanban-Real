export const isAllowedOrigin = (origin) => {
  if (!origin || process.env.NODE_ENV !== 'production') {
    return true;
  }

  const clientUrl = process.env.CLIENT_URL?.trim().replace(/\/+$/, '');
  return origin === clientUrl || origin === 'http://localhost:5173' || origin.endsWith('.vercel.app');
};
