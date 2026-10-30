import Link from "next/link";
import { Mascot } from "@/components/mascot";

export default function NotFound() {
  return (
    <div className="grid min-h-[50vh] place-items-center px-4 text-center">
      <div>
        <Mascot pose="shock" alt="The centurion looking shocked" className="mx-auto h-48 w-48 object-contain" />
        <h1 className="text-3xl font-medium">Page not found</h1>
        <Link className="mt-4 inline-block font-semibold text-[#ffe14a]" href="/swap">Go to Swap</Link>
      </div>
    </div>
  );
}
