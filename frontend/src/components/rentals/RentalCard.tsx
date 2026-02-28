import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Rental } from "@/types/rental.types";
import { formatCurrency, formatDate } from "@/utils/formatters";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const STATUS_VARIANT: Record<Rental["status"], BadgeVariant> = {
  pending: "outline",
  active: "default",
  completed: "secondary",
  cancelled: "destructive",
};

interface RentalCardProps {
  rental: Rental;
  onCancel?: (rental: Rental) => void;
}

export function RentalCard({ rental, onCancel }: RentalCardProps) {
  const totalDays =
    Math.ceil(
      (new Date(rental.endDate).getTime() -
        new Date(rental.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            {rental.car.brand} {rental.car.model} ({rental.car.year})
          </CardTitle>
          <Badge variant={STATUS_VARIANT[rental.status]}>
            {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-1 pb-3 text-sm">
        <p>
          <span className="text-muted-foreground">Period:</span>{" "}
          {formatDate(rental.startDate)} – {formatDate(rental.endDate)}
        </p>
        <p>
          <span className="text-muted-foreground">Duration:</span> {totalDays}{" "}
          {totalDays === 1 ? "day" : "days"}
        </p>
        <p>
          <span className="text-muted-foreground">Total:</span>{" "}
          <span className="font-medium">
            {formatCurrency(rental.car.pricePerDay * totalDays)}
          </span>
        </p>
      </CardContent>

      {onCancel &&
        (rental.status === "pending" || rental.status === "active") && (
          <CardFooter>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onCancel(rental)}
            >
              Cancel rental
            </Button>
          </CardFooter>
        )}
    </Card>
  );
}
