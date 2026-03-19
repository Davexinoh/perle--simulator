import "../styles/globals.css";
import { useEffect } from "react";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Ping every 14 minutes to prevent Render from sleeping
    const interval = setInterval(() => {
      fetch("/api/ping").catch(() => {});
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return <Component {...pageProps} />;
}
