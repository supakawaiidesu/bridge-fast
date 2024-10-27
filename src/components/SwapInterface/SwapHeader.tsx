import { Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";

export function SwapHeader() {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex gap-4 text-sm">
        <button className="bg-[#2B2D33] px-3 py-1.5 rounded-full font-semibold">Swap</button>
        <button className="text-[#5D6785] px-3 py-1.5">Limit</button>
        <button className="text-[#5D6785] px-3 py-1.5">Send</button>
        <button className="text-[#5D6785] px-3 py-1.5">Buy</button>
      </div>
      <Button variant="ghost" size="icon" className="text-[#5D6785] hover:text-white">
        <Settings className="h-5 w-5" />
      </Button>
    </div>
  );
}