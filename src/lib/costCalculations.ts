/**
 * Cost splitting utilities for ride sharing
 */

export interface CostBreakdown {
  totalCost: number;
  numberOfPassengers: number;
  costPerPerson: number;
  formattedTotalCost: string;
  formattedPerPersonCost: string;
}

/**
 * Calculate the cost per person for a ride
 * @param totalCost - Total cost of the ride
 * @param numberOfPassengers - Number of passengers (including driver, or just passengers)
 * @param includingDriver - If true, split includes driver; if false, only among passengers
 * @returns Cost breakdown information
 */
export const calculateCostSplit = (
  totalCost: number,
  numberOfPassengers: number,
  includingDriver: boolean = false
): CostBreakdown => {
  if (totalCost < 0 || numberOfPassengers <= 0) {
    return {
      totalCost: 0,
      numberOfPassengers,
      costPerPerson: 0,
      formattedTotalCost: "₹0.00",
      formattedPerPersonCost: "₹0.00",
    };
  }

  const divisor = includingDriver ? numberOfPassengers + 1 : numberOfPassengers;
  const costPerPerson = totalCost / divisor;

  return {
    totalCost,
    numberOfPassengers: divisor,
    costPerPerson: Math.round(costPerPerson * 100) / 100,
    formattedTotalCost: `₹${totalCost}`,
    formattedPerPersonCost: `₹${(Math.round(costPerPerson))}`,
  };
};

/**
 * Calculate total cost for multiple passengers
 * @param costPerPerson - Cost per person
 * @param numberOfPassengers - Number of passengers
 * @returns Formatted total cost
 */
export const calculateTotalCostForPassengers = (
  costPerPerson: number,
  numberOfPassengers: number
): string => {
  const total = costPerPerson * numberOfPassengers;
  return `₹${total}`;
};

/**
 * Format currency
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return `₹${amount}`;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};
