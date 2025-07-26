import { useState, useEffect, useMemo } from 'react';

interface UsePaginationProps<T> {
  data: T[];
  itemsPerPage: number;
  searchTerm?: string;
  filterFunction?: (item: T, searchTerm: string) => boolean;
}

interface PaginationResult<T> {
  currentItems: T[];
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalItems: number;
}

export function usePagination<T>({
  data,
  itemsPerPage,
  searchTerm = '',
  filterFunction
}: UsePaginationProps<T>): PaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data if search term and filter function are provided
  const filteredData = useMemo(() => {
    if (!searchTerm || !filterFunction) {
      return data;
    }
    return data.filter(item => filterFunction(item, searchTerm));
  }, [data, searchTerm, filterFunction]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData.length, searchTerm]);

  // Ensure current page is valid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return {
    currentItems,
    totalPages,
    currentPage,
    setCurrentPage,
    totalItems: filteredData.length
  };
}