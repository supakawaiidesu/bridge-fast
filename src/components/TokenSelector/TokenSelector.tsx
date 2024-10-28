import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogHeader
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChainSelector } from './ChainSelector';
import { TokenList } from './TokenList';
import { TokenWithChain } from '@/types/token';

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: TokenWithChain) => void;
  currentChain: string;
}

export function TokenSelector({ isOpen, onClose, onSelect, currentChain }: TokenSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChain, setSelectedChain] = useState(currentChain);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] bg-[#131313] border-[#2B2D33] p-0">
        <DialogHeader className="p-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white">
              Select a token
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-[#5e5e5e] hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5e5e5e]" />
            <Input
              placeholder="Search tokens"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#131313] border-[#2B2D33] text-white placeholder:text-[#5e5e5e]"
            />
          </div>

          <ChainSelector
            selectedChain={selectedChain}
            onChainSelect={setSelectedChain}
          />

          <ScrollArea className="h-[300px] pr-4">
            <TokenList
              searchQuery={searchQuery}
              selectedChain={selectedChain}
              onSelect={(token) => {
                onSelect(token);
                onClose();
              }}
            />
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
