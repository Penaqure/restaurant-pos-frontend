// Where each role lands right after signing in (and when visiting "/" while
// already signed in). Waiters live on the Tables screen during a shift --
// tapping a table there is how they start an order -- so that's home for
// them instead of the general Overview dashboard.
export function getHomeRoute(role: string): string {
  if (role === "super_admin") return "/platform";
  if (role === "waiter") return "/dashboard/tables";
  return "/dashboard";
}
