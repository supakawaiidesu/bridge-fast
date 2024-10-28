import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { chains } from '@/data/chains';

interface ChainSelectorProps {
  selectedChain: string;
  onChainSelect: (chain: string) => void;
}

export function ChainSelector({ selectedChain, onChainSelect }: ChainSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between bg-[#131313] border-[#2B2D33] text-white">
          <span className="flex items-center gap-2">
            {chains.find(c => c.name === selectedChain)?.icon}
            {selectedChain}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[320px] bg-[#131313] border-[#2B2D33]">
        {chains.map((chain) => (
          <DropdownMenuItem
            key={chain.name}
            onClick={() => onChainSelect(chain.name)}
            className="text-white hover:bg-[#2B2D33]"
          >
            <span className="flex items-center gap-2">
              {chain.icon} {chain.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}