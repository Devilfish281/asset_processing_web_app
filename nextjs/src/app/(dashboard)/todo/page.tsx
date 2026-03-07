// src/app/(dashboard)/todo/page.tsx
"use client";
import React from "react";
import { useUser } from "@clerk/nextjs";

export default function TodoPage() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn || !user) {
    return <div>Please sign in.</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Todo Page</h1>
      <p className="mt-4 text-gray-600">This is the todo page.</p>

      <p>User ID: {user.id}</p>
      <p>Username: {user.username ?? "No username set"}</p>
      <p>Full name: {user.fullName ?? "No full name"}</p>
      <p>First name: {user.firstName ?? "No first name"}</p>
      <p>Last name: {user.lastName ?? "No last name"}</p>
      <p>
        Primary email:{" "}
        {user.primaryEmailAddress?.emailAddress ?? "No primary email"}
      </p>
      <p>Image URL: {user.imageUrl}</p>
    </div>
  );
}
