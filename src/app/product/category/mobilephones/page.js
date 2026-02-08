import CategoryPage from "@/app/components/CategoryPage";
import { getCategoryLabel } from "@/lib/categories";

export default function MobilePhonesPage() {
  return (
    <CategoryPage
      categoryName={getCategoryLabel("Mobile")}
      categoryValue="Mobile"
    />
  );
}