'use client';

import React, {
  FC,
  ReactNode,
  useEffect,
  useState,
} from 'react';

export type HydrationGuardProps = {
  children: ReactNode;
}

/**
 * HydrationGuard is a component that prevents its children from being
 * rendered on the server, while still allowing them to be rendered on
 * the client. This is useful for components that need to use browser
 * APIs that are not available on the server, such as the `window`
 * object or Web APIs that require user interaction.
 *
 * The component works by using the `useState` hook to keep track of
 * whether the component has been mounted or not. On the server, the
 * component is not mounted, so the `mounted` state is `false`, and
 * the component does not render its children. On the client, the
 * component is mounted, so the `mounted` state is `true`, and the
 * component renders its children.
 * @param {ReactNode} children - The children to render only on the client.
 * @returns {ReactElement} The rendered children, or null if on the server.
 */
export const HydrationGuard:FC<HydrationGuardProps> = ({ children }) =>  {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <>{children}</>;
}
