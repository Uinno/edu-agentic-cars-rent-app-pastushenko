import { RentalCard } from "@/components/rentals/RentalCard";
import type { Rental } from "@/types/rental.types";

interface RentalsListProps {
  rentals: Rental[];
  onCancel?: (rental: Rental) => void;
  emptyMessage?: string;
}

export function RentalsList({
  rentals,
  onCancel,
  emptyMessage = "No rentals found.",
}: RentalsListProps) {
  if (rentals.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">{emptyMessage}</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rentals.map((rental) => (
        <RentalCard key={rental.id} rental={rental} onCancel={onCancel} />
      ))}
    </div>
  );
}
