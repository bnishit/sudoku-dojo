import type { ReactNode } from 'react';
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body style={{margin: 0, background: '#ebe7df', color: '#2A2D42', fontFamily: 'Arial, sans-serif'}}>{children}</body></html>;
}
