import { rentalsApi } from "@/api/rentals.api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Rental } from "@/types/rental.types";
import { formatDate } from "@/utils/formatters";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

const STATUS_VARIANT: Record<
  Rental["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  active: "default",
  completed: "secondary",
  cancelled: "destructive",
};

export function AdminRentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  async function loadRentals() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await rentalsApi.getAllRentals();
      setRentals(data);
    } catch (err) {
      console.error("[AdminRentalsPage] Failed to load rentals:", err);
      setError("Failed to load rentals.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRentals();
  }, []);

  async function handleComplete(rental: Rental) {
    setCompletingId(rental.id);
    try {
      await rentalsApi.completeRental(rental.id);
      console.debug("[AdminRentalsPage] Rental completed:", rental.id);
      await loadRentals();
    } catch (err) {
      console.error("[AdminRentalsPage] Complete failed:", err);
    } finally {
      setCompletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">All Rentals</h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="bg-muted h-64 animate-pulse rounded-lg" />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Renter</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentals.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground py-8 text-center"
                  >
                    No rentals found.
                  </TableCell>
                </TableRow>
              ) : (
                rentals.map((rental) => (
                  <TableRow key={rental.id}>
                    <TableCell>
                      {rental.car.brand} {rental.car.model} ({rental.car.year})
                    </TableCell>
                    <TableCell>{rental.user?.email ?? "—"}</TableCell>
                    <TableCell>{formatDate(rental.startDate)}</TableCell>
                    <TableCell>{formatDate(rental.endDate)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[rental.status]}>
                        {rental.status.charAt(0).toUpperCase() +
                          rental.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(rental.status === "active" ||
                        rental.status === "pending") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={completingId === rental.id}
                          onClick={() => handleComplete(rental)}
                        >
                          <CheckCircle className="mr-1 h-4 w-4 text-green-600" />
                          {completingId === rental.id
                            ? "Completing…"
                            : "Complete"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
