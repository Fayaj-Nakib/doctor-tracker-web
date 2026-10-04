'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type SearchInputProps = {
  /** Current value from the URL; the input starts from it. */
  defaultValue: string;
  /** Called 300 ms after the user stops typing: one request per pause, not per key. */
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
};

/**
 * To reset it from outside (e.g. "Clear filters"), give it a new `key`.
 * Keeping the text local avoids the cursor jumping while the URL catches up.
 */
export function SearchInput({ defaultValue, onSearch, placeholder, className }: SearchInputProps) {
  const [text, setText] = useState(defaultValue);

  useEffect(() => {
    if (text.trim() === defaultValue.trim()) return;
    const timer = setTimeout(() => onSearch(text.trim()), 300);
    return () => clearTimeout(timer);
  }, [text, defaultValue, onSearch]);

  return (
    <div className={cn('relative', className)}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder ?? 'Search'}
        className="pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => setText('')}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded p-1"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
