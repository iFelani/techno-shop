import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import useCategory from "../../hooks/category/category";
import Section from "../../components/root/Section";
import SectionHeader from "../../components/root/SectionHeader";
import Filters from "../../components/root/Filters";
import Sort from "../../components/root/Sort";
import InfiniteScroll from "../../components/InfiniteScroll";
import Product from "../../components/root/Product";
import ProductSkeleton from "../../components/root/ProductSkeleton";
import NoResultFound from "../../components/NoResultFound";

const Category = () => {
  const { title } = useParams();
  const [searchParams] = useSearchParams();
  const { isFetchingCategory, isCategoryError, category, hasCategoryNextPage, fetchCategoryNextPage } = useCategory(title.toLowerCase().split(" ").join("-"), searchParams.get("brands"), searchParams.get("price"), searchParams.get("only-available"), searchParams.get("only-amazing"), searchParams.get("sort"), 4);

  useEffect(() => {
    document.title = isCategoryError || isFetchingCategory ? "تکنوشاپ" : `تکنوشاپ - ${category.title}`;
  }, [isCategoryError, isFetchingCategory, category]);

  useEffect(() => {
    if (isCategoryError) {
      throw Object.assign(new Error("The category was not found."), { status: 404 });
    }
  }, [isCategoryError]);

  return !isCategoryError && (
    <>
      <SectionHeader title={isFetchingCategory ? "در حال بارگذاری" : category.title} condition={true} quantity={isFetchingCategory ? 0 : category.totalProducts} />
      <Section className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <Filters brandsFilter={true} priceFilter={true} onlyAvailableFilter={true} onlyAmazingFilter={true} />
        <div className="w-full">
          <Sort sortFor="products" />
          {category?.products.length === 0 ? (
            <NoResultFound title="محصولی پیدا نشد!" />
          ) : (
            <InfiniteScroll hasNextPage={hasCategoryNextPage} fetchNextPage={fetchCategoryNextPage}>
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {category?.products.map((product) => <Product key={product._id} {...product} category={category} />)}
                {isFetchingCategory && Array(6).fill(0).map((product, index) => <ProductSkeleton key={index} />)}
              </div>
            </InfiniteScroll>
          )}
        </div>
      </Section>
    </>
  );
};

export default Category;