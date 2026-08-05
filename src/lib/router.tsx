import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";

type RouterContextValue = {
  path: string;
  navigate: (to: string, replace?: boolean) => void;
};

const RouterContext = createContext<RouterContextValue | null>(null);

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function getAppPath() {
  const { pathname } = window.location;

  if (!basePath) return pathname;
  if (pathname === basePath) return "/";
  if (pathname.startsWith(`${basePath}/`)) return pathname.slice(basePath.length);

  return pathname;
}

function getBrowserPath(path: string) {
  return `${basePath}${path}`;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(getAppPath);

  useEffect(() => {
    const handlePopState = () => setPath(getAppPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const value = useMemo<RouterContextValue>(
    () => ({
      path,
      navigate(to, replace = false) {
        const browserPath = getBrowserPath(to);
        if (replace) window.history.replaceState(null, "", browserPath);
        else window.history.pushState(null, "", browserPath);
        setPath(getAppPath());
        window.scrollTo({ top: 0, behavior: "auto" });
      },
    }),
    [path],
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) throw new Error("useRouter must be used inside RouterProvider.");
  return context;
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  replace?: boolean;
};

export function Link({ to, replace = false, onClick, target, ...props }: LinkProps) {
  const { navigate } = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      target === "_blank"
    ) {
      return;
    }
    event.preventDefault();
    navigate(to, replace);
  }

  return <a {...props} href={getBrowserPath(to)} target={target} onClick={handleClick} />;
}

export function Redirect({ to }: { to: string }) {
  const { navigate } = useRouter();
  useEffect(() => navigate(to, true), [navigate, to]);
  return null;
}
