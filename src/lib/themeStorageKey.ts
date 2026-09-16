// Deliberately its own tiny module with no "use client" directive: the
// no-flash script in layout.tsx (a Server Component) needs this string
// inlined at render time, and importing a const from a "use client" module
// into a Server Component resolves to a client reference instead of the
// real value there -- it silently became the literal string "undefined" in
// the rendered script. Keeping the key here, imported by both the server
// layout and the client ThemeContext, avoids that boundary entirely.
export const THEME_STORAGE_KEY = "billing_theme";
