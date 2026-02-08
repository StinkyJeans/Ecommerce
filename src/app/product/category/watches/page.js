import CategoryPage from "@/app/components/CategoryPage";
import { getCategoryLabel } from "@/lib/categories";

export default function WatchesPage() {
  return (
    <CategoryPage
      categoryName={getCategoryLabel("Watch")}
      categoryValue="Watch"
    />
  );
}