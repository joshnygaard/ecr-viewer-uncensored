"use client";

import { Search } from "@trussworks/react-uswds";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface LibrarySearchProps {
  className?: string;
  textBoxClassName?: string;
}

/**
 * eCR Library search bar component
 * @param props - Properties to pass into
 * @param props.className - The class name to pass into the USWDS search component
 * @param props.textBoxClassName - The class name to pass into the input props for the USWDS search component
 * @returns - Search bar component for the eCR Library
 */
const LibrarySearch = ({ className, textBoxClassName }: LibrarySearchProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", "1");
      params.set(name, value);
      return params.toString();
    },
    [searchParams],
  );
  return (
    <Search
      placeholder="Search by patient"
      onSubmit={(e) => {
        e.preventDefault();
        const searchTerm = (
          e.currentTarget.elements.namedItem("search-field") as HTMLInputElement
        )?.value;
        if (searchParams.get("search") !== searchTerm) {
          router.push(pathname + "?" + createQueryString("search", searchTerm));
        }
      }}
      defaultValue={searchParams.get("search") ?? undefined}
      size="small"
      large={true}
      className={className}
      inputProps={{ className: textBoxClassName }}
    />
  );
};

export default LibrarySearch;
