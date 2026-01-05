import CategoryPage from "@/app/components/CategoryPage";
import { faDesktop } from "@fortawesome/free-solid-svg-icons";

export default function ComputersPage() {
  return (
    <CategoryPage 
      categoryName="PC & Computers" 
      categoryIcon={faDesktop} 
      categoryValue="Pc" 
    />
  );
}