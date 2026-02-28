import { carsApi } from "@/api/cars.api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Car, CreateCarDto } from "@/types/car.types";
import { formatCurrency } from "@/utils/formatters";
import { PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const EMPTY_FORM: CreateCarDto = {
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  pricePerDay: 0,
  isAvailable: true,
};

export function AdminCarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<CreateCarDto>(EMPTY_FORM);
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Car | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function loadCars() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await carsApi.getCars();
      setCars(data);
    } catch (err) {
      console.error("[AdminCarsPage] Failed to load cars:", err);
      setError("Failed to load cars.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCars();
  }, []);

  async function handleAdd() {
    setAddError(null);
    setIsAdding(true);
    try {
      await carsApi.createCar(form);
      console.debug("[AdminCarsPage] Car created");
      setAddOpen(false);
      setForm(EMPTY_FORM);
      await loadCars();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to add car.";
      setAddError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await carsApi.deleteCar(deleteTarget.id);
      console.debug("[AdminCarsPage] Car deleted:", deleteTarget.id);
      setDeleteTarget(null);
      await loadCars();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to delete car.";
      setDeleteError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Car Inventory</h1>
        <Button
          size="sm"
          onClick={() => {
            setForm(EMPTY_FORM);
            setAddError(null);
            setAddOpen(true);
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add car
        </Button>
      </div>

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
                <TableHead>Brand</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Price / day</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground py-8 text-center"
                  >
                    No cars in inventory.
                  </TableCell>
                </TableRow>
              ) : (
                cars.map((car) => (
                  <TableRow key={car.id}>
                    <TableCell>{car.brand}</TableCell>
                    <TableCell>{car.model}</TableCell>
                    <TableCell>{car.year}</TableCell>
                    <TableCell>{formatCurrency(car.pricePerDay)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={car.isAvailable ? "default" : "secondary"}
                      >
                        {car.isAvailable ? "Available" : "Rented"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(car);
                        }}
                        aria-label="Delete car"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add car dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add new car</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={form.brand}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, brand: e.target.value }))
                  }
                  placeholder="Toyota"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={form.model}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, model: e.target.value }))
                  }
                  placeholder="Camry"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={form.year}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, year: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="price">Price per day ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={form.pricePerDay}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      pricePerDay: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            {addError && (
              <Alert variant="destructive">
                <AlertDescription>{addError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={
                isAdding || !form.brand || !form.model || form.pricePerDay <= 0
              }
            >
              {isAdding ? "Saving…" : "Save car"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete car?</DialogTitle>
            <DialogDescription>
              {deleteTarget && (
                <>
                  Permanently remove{" "}
                  <strong>
                    {deleteTarget.brand} {deleteTarget.model} (
                    {deleteTarget.year})
                  </strong>
                  ? This cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <Alert variant="destructive">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
