import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import type { CollectionEntry } from "../../ogs/ogsApi";

export const PAGE_SIZE = 10;

function Rating({ row }: { row: CollectionEntry }) {
  if (row.rating === null) return "-";
  return (
    <Box
      component="span"
      sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}
    >
      <StarIcon sx={{ fontSize: 12 }} /> {row.rating.toFixed(1)} (
      {row.rating_count})
    </Box>
  );
}

export default function CollectionsTable({
  entries,
  onSelect,
  paginate,
  progressPending,
  totalRows,
  onChangePage,
  pageNumber,
  keyHint,
  sortColumn,
  sortDescending = false,
  onSort,
}: {
  entries: CollectionEntry[];
  onSelect: (collection: CollectionEntry) => void;
  paginate: boolean;
  progressPending?: boolean;
  totalRows?: number;
  onChangePage?: (page: number) => void;
  pageNumber?: number;
  keyHint?: string;
  sortColumn?: number;
  sortDescending?: boolean;
  onSort?: (index: number) => void;
}) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("sm"));

  const columns: {
    label: string;
    sortValue?: (row: CollectionEntry) => number | string;
    render: (row: CollectionEntry) => React.ReactNode;
    hideWhenCompact?: boolean;
  }[] = [
    {
      label: "Name",
      sortValue: (row) => row.name,
      render: (row) =>
        compact ? (
          <>
            {row.name}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                columnGap: 0.5,
              }}
            >
              By {row.owner.username} · {row.puzzle_count} puzzles ·{" "}
              <Rating row={row} />
            </Typography>
          </>
        ) : (
          row.name
        ),
    },
    {
      label: "Owner",
      sortValue: (row) => row.owner.username,
      render: (row) => row.owner.username,
      hideWhenCompact: true,
    },
    {
      label: "Puzzles",
      sortValue: (row) => row.puzzle_count,
      render: (row) => row.puzzle_count,
      hideWhenCompact: true,
    },
    {
      label: "Rating",
      sortValue: (row) => row.rating ?? -1,
      render: (row) => <Rating row={row} />,
      hideWhenCompact: true,
    },
    {
      label: "",
      render: (row) => (
        <Button size="small" variant="outlined" onClick={() => onSelect(row)}>
          Print
        </Button>
      ),
    },
  ];

  const [localSortColumn, setLocalSortColumn] = useState<number>();
  const [localSortDescending, setLocalSortDescending] = useState(false);

  const activeSortColumn = sortColumn ?? localSortColumn;
  const activeSortDescending =
    sortColumn === undefined ? localSortDescending : sortDescending;

  function sortBy(index: number): void {
    const column = columns[index];
    if (column === undefined || column.sortValue === undefined) return;
    if (onSort !== undefined) {
      onSort(index);
    } else if (activeSortColumn === index) {
      setLocalSortDescending(!localSortDescending);
    } else {
      setLocalSortColumn(index);
      setLocalSortDescending(false);
    }
  }

  const visibleColumns = columns
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => !(compact && column.hideWhenCompact));

  const activeSort =
    activeSortColumn === undefined ? undefined : columns[activeSortColumn];
  const sortValue = onSort === undefined ? activeSort?.sortValue : undefined;
  const sortedEntries =
    sortValue !== undefined
      ? [...entries].sort((a, b) => {
          const va = sortValue(a);
          const vb = sortValue(b);
          const cmp =
            typeof va === "number" && typeof vb === "number"
              ? va - vb
              : String(va).localeCompare(String(vb));
          return activeSortDescending ? -cmp : cmp;
        })
      : entries;

  return (
    <Box key={keyHint}>
      <Box sx={{ position: "relative" }}>
        <TableContainer
          sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}
        >
          <Table size="small">
            <TableHead sx={{ position: "relative", zIndex: 1 }}>
              <TableRow>
                {visibleColumns.map(({ column, index }) => (
                  <TableCell key={column.label}>
                    {column.sortValue === undefined || compact ? (
                      column.label
                    ) : (
                      <TableSortLabel
                        active={activeSortColumn === index}
                        direction={activeSortDescending ? "desc" : "asc"}
                        onClick={() => sortBy(index)}
                      >
                        {column.label}
                      </TableSortLabel>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedEntries.map((row, rowIndex) => (
                <TableRow key={rowIndex} hover>
                  {visibleColumns.map(({ column }) => (
                    <TableCell
                      key={column.label}
                      sx={{ overflowWrap: "anywhere" }}
                    >
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {sortedEntries.length === 0 && !progressPending && (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length}>
                    No collections found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {progressPending && (
          <Box
            sx={{
              position: "absolute",
              inset: 1,
              borderRadius: 1,
              bgcolor: "background.default",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
      {paginate && (
        <TablePagination
          component="div"
          count={totalRows ?? 0}
          page={pageNumber ?? 0}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[]}
          onPageChange={(_, newPage) => onChangePage?.(newPage)}
        />
      )}
    </Box>
  );
}
