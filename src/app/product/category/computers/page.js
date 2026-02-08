import CategoryPage from "@/app/components/CategoryPage";
import { getCategoryLabel } from "@/lib/categories";

export default function ComputersPage() {
  return (
    <CategoryPage
      categoryName={getCategoryLabel("Pc")}
      categoryValue="Pc"
    />
  );
}