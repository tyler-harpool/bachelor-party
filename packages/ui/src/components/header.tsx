// bachelor-party-app/apps/packages/ui/components/header.tsx
import { useNavigation, RouteKey } from "@repo/ui/navigation";

interface NavLinkProps {
  to: RouteKey;
  children: React.ReactNode;
  className?: string;
}

// NavLink component that works for both web and native
function NavLink({ to, children, className = "" }: NavLinkProps) {
  const { navigate, currentRoute, isNative } = useNavigation();

  // Skip rendering auth links on native
  if (isNative && (to === '/login' || to === '/signup')) {
    return null;
  }

  const isActive = currentRoute === to;
  const activeClass = isActive ? "font-bold" : "";

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
  };

  // For web, use actual anchor tags (better for SEO and accessibility)
  // For native, use div with onClick
  if (isNative) {
    return (
      <div
        onClick={handleClick}
        className={`cursor-pointer px-4 py-2 ${activeClass} ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <a
      href={to}
      onClick={handleClick}
      className={`px-4 py-2 ${activeClass} ${className}`}
    >
      {children}
    </a>
  );
}

export function Header() {
  const { isNative } = useNavigation();

  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Bachelor Party App</h1>
        <nav className="flex space-x-2">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/test-poll">Poll System</NavLink>
          <NavLink to="/native-poll">Native Poll</NavLink>
          {!isNative && (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/signup">Sign Up</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
