/**
 * Local-shell stand-in for `next/link`.
 *
 * The shell renders the landing page from APK assets; every in-app
 * destination ("/products", "/collections/tops", "/login", …) lives in the
 * real application on the remote origin. This shim renders a plain <a> whose
 * href is mapped onto the live app, so the WebView performs one ordinary
 * navigation into the real application — where cookies, the Supabase
 * session, cart, checkout, Google OAuth, the service worker and deep links
 * all keep working exactly as they do in the production web app.
 *
 * `prefetch` is a Next-only hint and is dropped; `scroll`, `replace` and the
 * object-form href are not used by any component in the shell tree.
 */
import React from "react";
import { remotePath } from "../constants";

export interface LinkProps {
  href: string;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  children?: React.ReactNode;
  [key: string]: unknown;
}

export default function Link({
  href,
  prefetch,
  replace,
  scroll,
  children,
  ...rest
}: LinkProps) {
  void prefetch;
  void replace;
  void scroll;
  return (
    <a href={remotePath(href)} {...rest}>
      {children}
    </a>
  );
}
