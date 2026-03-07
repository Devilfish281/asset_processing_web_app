// src/components/Sidebar.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import SidebarNav from "./SidebarNav";
import SidebarToggle from "./SidebarToggle";

import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";

import UserProfileSection from "./UserProfileSection";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isSignedIn } = useUser();

  const sidebarRef = useRef<HTMLDivElement>(null); // Changed Code
  const buttonRef = useRef<HTMLButtonElement | null>(null); // Added Code

  {
    /* TODO: Handle Resize */
  }

  // useEffect(() => {
  //   const handleOutsideClick = (event: MouseEvent) => {
  //     if (
  //       sidebarRef.current &&
  //       !sidebarRef.current.contains(event.target as Node)
  //     ) {
  //       if (isOpen) {
  //         setIsOpen(false);
  //       }
  //     }
  //   };

  //   window.addEventListener("mousedown", handleOutsideClick);

  //   return () => {
  //     window.removeEventListener("mousedown", handleOutsideClick);
  //   };
  // }, [isOpen]);

  // --- handleOutsideClick ---
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const targetNode = event.target as Node; // Added Code

      const clickedInsideSidebar = !!(
        // Added Code
        (sidebarRef.current && sidebarRef.current.contains(targetNode))
      ); // Added Code

      const clickedToggleButton = !!(
        // Added Code
        (buttonRef.current && buttonRef.current.contains(targetNode))
      ); // Added Code

      if (!clickedInsideSidebar && !clickedToggleButton && isOpen) {
        // Changed Code
        setIsOpen(false); // Changed Code
      } // Changed Code
    };

    // --- addEventListener mousedown ---
    window.addEventListener("mousedown", handleOutsideClick);

    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const renderMenuIcon = () => {
    return isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />;
  };

  return (
    <div>
      {/* Mobile X toggle in the left side of screen */}

      <Button
        ref={buttonRef} // Added Code
        variant="ghost"
        onClick={toggleSidebar}
        className={cn(
          "fixed top-4 left-4 z-50 bg-transparent hover:bg-gray-100/50 backdrop-blur-sm",
          "lg:hidden",
        )}
      >
        {renderMenuIcon()}
      </Button>

      {/* Store all components in nav */}
      {/* Sidebar content 114 */}
      <div
        ref={sidebarRef}
        className={cn(
          "bg-gray-100 flex flex-col h-screen transition-all duration-300 overflow-y-auto",
          // Base styles for mobile sidebar
          "fixed inset-y-0 left-0 z-40 w-64 transform",
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Adjustments for desktop
          "lg:translate-x-0 lg:static lg:w-64",
          isCollapsed && "lg:w-28",
        )}
      >
        {/* Name and menu items <SidebarNav /> Style grow*/}
        <div className={cn("flex flex-col grow p-6", "pt-16 lg:pt-10")}>
          {!isCollapsed && (
            <h1 className="text-4xl font-bold mb-10 hidden lg:block">
              AI - Life Coach
            </h1>
          )}

          <SidebarNav isCollapsed={isCollapsed} />
        </div>

        {/* TODO: User profile from clerk */}
        {/* Sidebar “header” area (Clerk controls) */}

        {/* ------  Sidebar Toggle  ------*/}
        {isSignedIn && <UserProfileSection isCollapsed={isCollapsed} />}
        <SidebarToggle
          isCollapsed={isCollapsed}
          toggleSidebar={toggleCollapse}
        />
      </div>
    </div>
  );
}

export default Sidebar;
