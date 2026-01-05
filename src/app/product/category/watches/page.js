import CategoryPage from "@/app/components/CategoryPage";
import { faClock } from "@fortawesome/free-solid-svg-icons";

export default function WatchesPage() {
  return (
    <CategoryPage 
      categoryName="Watches" 
      categoryIcon={faClock} 
      categoryValue="Watch" 
    />
  );
}