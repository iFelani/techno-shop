import { Link } from "react-router-dom";
import ProductCover from "../ProductCover";
import ProductPrice from "../ProductPrice";
import AmazingOfferTimer from "../AmazingOfferTimer";

const AmazingOfferProduct = ({ _id, covers, title, colors, offer }) => {
  return (
    <div className="min-w-56 bg-white">
      <div className="h-48 w-full">
        <ProductCover id={_id} covers={covers} />
        <div className="absolute right-4 top-4 z-10 flex h-7 w-12 items-center justify-center rounded-full bg-primary-900 font-vazirmatn-medium text-white">{offer.percent}%</div>
      </div>
      <div className="p-3">
        <h3 className="h-16 font-vazirmatn-medium text-lg/relaxed">
          <Link to={`/products/${_id}`} className="line-clamp-2 transition-colors hover:text-primary-900">{title}</Link>
        </h3>
        <div className="flex items-center justify-between gap-x-3 border-t border-zinc-200 pt-2">
          <div className="flex flex-col items-center">
            <AmazingOfferTimer width="32" fontSize="xs" expiresAt={offer.expiresAt} />
          </div>
          <ProductPrice price={colors[0].price} offer={offer} priceFontSize="base" discountedPriceFontSize="xs" gapX="px" iconSize="4" hasInventory={colors[0].inventory} />
        </div>
      </div>
    </div>
  );
};

export default AmazingOfferProduct;