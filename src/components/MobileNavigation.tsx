import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NavLink {
  href: string;
  label: string;
  icon: string;
  isActive: boolean;
}

interface MobileNavigationProps {
  navLinks: NavLink[];
  userEmail: string;
}

export function MobileNavigation({ navLinks, userEmail }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleMenu}
          aria-controls="mobile-menu"
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
        >
          {/* Ikona hamburgera */}
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </Button>
      </div>

      {/* Mobile menu overlay and content */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={toggleMenu} aria-hidden="true" />

          {/* Menu panel */}
          <div
            id="mobile-menu"
            className="fixed inset-y-0 right-0 w-64 bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-in-out"
          >
            <div className="flex flex-col h-full">
              {/* Header z przyciskiem zamknięcia */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <span className="text-lg font-semibold text-gray-900">Menu</span>
                <Button type="button" variant="ghost" size="icon" onClick={toggleMenu} aria-label="Close menu">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              {/* Navigation links */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                        link.isActive
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                      aria-current={link.isActive ? "page" : undefined}
                      onClick={toggleMenu}
                    >
                      <span className="text-xl">{link.icon}</span>
                      <span>{link.label}</span>
                    </a>
                  ))}
                </div>
              </nav>

              {/* User info w stopce */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">{userEmail.charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{userEmail}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
