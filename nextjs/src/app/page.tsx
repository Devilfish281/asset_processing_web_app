import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div>
      <div className="bg-red-500 text-white">
        <h1 className="text-4xl font-bold">Hello, World!</h1>
        <p className="mt-4 text-lg">Welcome to my Next.js app.</p>
      </div>
      <Button className="mt-4" variant="outline">
        Click Me
      </Button>
    </div>
  );
}
