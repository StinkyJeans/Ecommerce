import CategoryPage from "@/app/components/CategoryPage";
import { faMobileAlt } from "@fortawesome/free-solid-svg-icons";

export default function MobilePhonesPage() {
  return (
    <CategoryPage 
      categoryName="Mobile Devices" 
      categoryIcon={faMobileAlt} 
      categoryValue="Mobile" 
    />
  );
}