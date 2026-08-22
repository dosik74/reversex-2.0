import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface SearchFilterComponentProps {
  onSearch: (query: string) => void;
  onFilterChange?: (filters: any) => void;
  placeholder?: string;
  showFilters?: boolean;
}

const SearchFilterComponent = ({
  onSearch,
  onFilterChange,
  placeholder = "Search...",
  showFilters = true,
}: SearchFilterComponentProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterGenre, setFilterGenre] = useState("all");

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    onSearch(value);
  }, [onSearch]);

  const handleClear = () => {
    setSearchQuery("");
    onSearch("");
  };

  const handleFilterChange = () => {
    onFilterChange?.({
      query: searchQuery,
      sortBy,
      genre: filterGenre,
    });
  };

  const genres = [
    { value: "all", label: "All Genres" },
    { value: "action", label: "Action" },
    { value: "drama", label: "Drama" },
    { value: "horror", label: "Horror" },
    { value: "comedy", label: "Comedy" },
    { value: "romance", label: "Romance" },
    { value: "scifi", label: "Sci-Fi" },
    { value: "fantasy", label: "Fantasy" },
  ];

  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "rating", label: "Top Rated" },
    { value: "popular", label: "Most Popular" },
    { value: "oldest", label: "Oldest First" },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative max-w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={handleClear}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex gap-2 flex-wrap">
          <Select value={sortBy} onValueChange={(value) => {
            setSortBy(value);
            handleFilterChange();
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterGenre} onValueChange={(value) => {
            setFilterGenre(value);
            handleFilterChange();
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Genre..." />
            </SelectTrigger>
            <SelectContent>
              {genres.map((genre) => (
                <SelectItem key={genre.value} value={genre.value}>
                  {genre.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchQuery || sortBy !== "recent" || filterGenre !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSortBy("recent");
                setFilterGenre("all");
                onSearch("");
                onFilterChange?.({
                  query: "",
                  sortBy: "recent",
                  genre: "all",
                });
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFilterComponent;
