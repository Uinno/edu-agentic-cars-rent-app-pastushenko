import { rentalsApi } from "@/api/rentals.api";
import { RentalsList } from "@/components/rentals/RentalsList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import type { Rental } from "@/types/rental.types";
import { useEffect, useState } from "react";

export function DashboardPage() {
  const { user } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancel confirmation dialog
  const [cancelTarget, setCancelTarget] = useState<Rental | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function loadRentals() {
    setIsLoading(true);
    setError(null);
    try {
      console.debug("[DashboardPage] Loading my rentals");
      const data = await rentalsApi.getMyRentals();
      setRentals(data);
    } catch (err) {
      console.error("[DashboardPage] Failed to load rentals:", err);
      setError("Failed to load your rentals. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRentals();
  }, []);

  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      await rentalsApi.cancelRental(cancelTarget.id);
      console.debug("[DashboardPage] Rental cancelled:", cancelTarget.id);
      setCancelTarget(null);
      await loadRentals();
    } catch (err: unknown) {
      console.error("[DashboardPage] Cancel failed:", err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to cancel rental. Please try again.";
      setCancelError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsCancelling(false);
    }
  }

  const active = rentals.filter(
    (r) => r.status === "active" || r.status === "pending",
  );
  const history = rentals.filter(
    (r) => r.status === "completed" || r.status === "cancelled",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your car rentals below.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-muted h-32 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {/* Active / pending */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Active Rentals</h2>
            <RentalsList
              rentals={active}
              onCancel={setCancelTarget}
              emptyMessage="You have no active rentals."
            />
          </section>

          <Separator />

          {/* History */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Rental History</h2>
            <RentalsList
              rentals={history}
              emptyMessage="Your rental history will appear here."
            />
          </section>
        </>
      )}

      {/* Cancel confirm dialog */}
      <Dialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel rental?</DialogTitle>
            <DialogDescription>
              {cancelTarget && (
                <>
                  Cancel your rental of{" "}
                  <strong>
                    {cancelTarget.car.brand} {cancelTarget.car.model}
                  </strong>
                  ? This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {cancelError && (
            <Alert variant="destructive">
              <AlertDescription>{cancelError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelTarget(null)}
              disabled={isCancelling}
            >
              Keep rental
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling…" : "Yes, cancel it"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
