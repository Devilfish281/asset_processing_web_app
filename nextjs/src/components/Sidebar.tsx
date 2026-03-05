// src/components/Sidebar.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import SidebarNav from "./SidebarNav";

function Sidebar() {
  const [isMobile, setIsMobile] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  {
    /* TODO: Handle Resize */
  }
  useEffect(() => {}, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  const handleOutsideClick = () => {};

  const renderMenuIcon = () => {
    return isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />;
  };

  return (
    <div>
      {/* Mobile X toggle in the left side of screen */}

      <Button
        variant="ghost"
        onClick={toggleSidebar}
        className={cn(
          "fixed top-4 left-4 z-50 bg-transparent hover:bg-gray-100/50 backdrop-blur-sm",
          "lg:hidden",
        )}
      >
        {renderMenuIcon()}
      </Button>
      {/* TODO: Store all components in nav */}
      {(!isMobile || isOpen) && (
        <div
          className={cn(
            "bg-gray-100 flex flex-col h-screen transition-all duration-300 overflow-y-auto",
            // MOBILE STYLES
            !isMobile
              ? ""
              : `fixed inset-y-0 left-0 z-40 w-64 transform ${
                  isOpen ? "translate-x-0" : "translate-x-full"
                }`,
            // DESKTOP STYLES
            isMobile
              ? ""
              : isCollapsed
                ? "w-28 h-screen sticky top-0"
                : "w-64 h-screen sticky top-0",
          )}
        >
          <div
            className={cn(
              "flex flex-col grow p-6",
              isMobile ? "pt-16" : "pt-10",
            )}
          >
            <h1 className="text-4xl font-bold mb-10">AI Marketing Platform</h1>
            <div className="font-sans text-2xl">Poppins test</div>
            {/* TODO: <SidebarNav /> */}
            <SidebarNav isMobile={isMobile} isCollapsed={isCollapsed} />
          </div>
          <div>
            {/* TODO: User profile from clerk */}
            {/* {!isMobile && (
              <SidebarToggle
                isCollapsed={isCollapsed}
                toggleSidebar={toggleSidebar}
              />
            )} */}
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
