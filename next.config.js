/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removes the X-Powered-By: Next.js header that reveals your tech stack.
  poweredByHeader: false,

  images: {
    domains: [],
  },

  async headers() {
    return [
      {
        // Apply security headers to every route.
        source: "/(.*)",
        headers: [
          // Prevents your site from being embedded in an iframe (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },

          // Stops browsers from MIME-sniffing a response away from the declared type.
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Controls how much referrer info is sent with requests.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Disables browser APIs your site doesn't need.
          // geolocation=(self) allows the "Use My Location" feature on same-origin pages.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },

          // Content Security Policy — restricts what resources browsers can load.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // 'unsafe-inline' is required for Next.js inline scripts and Tailwind.
              "script-src 'self' 'unsafe-inline'",
              // Allow Google Fonts stylesheets.
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Allow images from Supabase storage and OpenStreetMap map tiles.
              // Marker icons are served locally from /public/leaflet/ — no unpkg needed.
              "img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org",
              // Allow Supabase REST + WebSocket connections and Nominatim reverse geocoding.
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org",
              // Allow Google Fonts actual font files (served from gstatic.com).
              "font-src 'self' https://fonts.gstatic.com",
              // Allow the Admin Dashboard to embed the OpenStreetMap iframe in the map modal.
              "frame-src https://www.openstreetmap.org",
              // Redundant with X-Frame-Options but required by CSP Level 2.
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
